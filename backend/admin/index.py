'''
Business: Admin panel for managing users and energy distribution
Args: event - dict with httpMethod, body, headers; context - object with request_id
Returns: HTTP response with admin actions or user data
'''
import json
import os
import jwt
from datetime import datetime
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field

DATABASE_URL = os.environ.get('DATABASE_URL', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-this-secret-key')

class GiveEnergyRequest(BaseModel):
    target_email: str
    amount: int = Field(..., gt=0)
    reason: str = Field(default='Admin award')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except:
        return None

def verify_admin(token: str, conn) -> Optional[int]:
    payload = verify_token(token)
    if not payload:
        return None
    
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE id = %s AND is_admin = TRUE", (payload['user_id'],))
        user = cur.fetchone()
        return user[0] if user else None

def log_user_action(conn, user_id: int, action_type: str, description: str, energy_change: int, ip_address: str):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO user_logs (user_id, action_type, action_description, energy_change, ip_address) VALUES (%s, %s, %s, %s, %s)",
            (user_id, action_type, description, energy_change, ip_address)
        )
        conn.commit()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    auth_token = event.get('headers', {}).get('X-Auth-Token', '')
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Требуется авторизация'})
        }
    
    conn = get_db_connection()
    ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    
    try:
        admin_id = verify_admin(auth_token, conn)
        if not admin_id:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Доступ запрещен. Только для администраторов'})
            }
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', '')
            
            if action == 'users':
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, email, nickname, energy, is_admin, created_at, last_login, 
                               total_projects, total_publishes 
                        FROM users 
                        ORDER BY created_at DESC
                    """)
                    users = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'users': [dict(u) for u in users]}, default=str)
                    }
            
            elif action == 'stats':
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(*) FROM users WHERE is_admin = FALSE")
                    total_users = cur.fetchone()[0]
                    
                    cur.execute("SELECT COUNT(*) FROM projects")
                    total_projects = cur.fetchone()[0]
                    
                    cur.execute("SELECT COUNT(*) FROM projects WHERE published = TRUE")
                    total_published = cur.fetchone()[0]
                    
                    cur.execute("SELECT COALESCE(SUM(energy), 0) FROM users WHERE is_admin = FALSE")
                    total_energy = cur.fetchone()[0]
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'total_users': total_users,
                            'total_projects': total_projects,
                            'total_published': total_published,
                            'total_energy_distributed': total_energy
                        })
                    }
            
            elif action == 'logs':
                user_id = event.get('queryStringParameters', {}).get('user_id')
                limit = int(event.get('queryStringParameters', {}).get('limit', 50))
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if user_id:
                        cur.execute("""
                            SELECT ul.*, u.nickname, u.email 
                            FROM user_logs ul
                            JOIN users u ON ul.user_id = u.id
                            WHERE ul.user_id = %s
                            ORDER BY ul.created_at DESC
                            LIMIT %s
                        """, (user_id, limit))
                    else:
                        cur.execute("""
                            SELECT ul.*, u.nickname, u.email 
                            FROM user_logs ul
                            JOIN users u ON ul.user_id = u.id
                            ORDER BY ul.created_at DESC
                            LIMIT %s
                        """, (limit,))
                    
                    logs = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'logs': [dict(log) for log in logs]}, default=str)
                    }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'give_energy':
                req = GiveEnergyRequest(**body)
                
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id, nickname FROM users WHERE email = %s OR nickname = %s",
                        (req.target_email, req.target_email)
                    )
                    target_user = cur.fetchone()
                    
                    if not target_user:
                        return {
                            'statusCode': 404,
                            'headers': headers,
                            'body': json.dumps({'error': 'Пользователь не найден'})
                        }
                    
                    target_id, target_nickname = target_user
                    
                    cur.execute(
                        "UPDATE users SET energy = energy + %s WHERE id = %s RETURNING energy",
                        (req.amount, target_id)
                    )
                    new_energy = cur.fetchone()[0]
                    
                    cur.execute(
                        "INSERT INTO energy_transactions (user_id, amount, transaction_type, description, admin_id) VALUES (%s, %s, %s, %s, %s)",
                        (target_id, req.amount, 'admin_award', req.reason, admin_id)
                    )
                    
                    conn.commit()
                    
                    log_user_action(conn, target_id, 'energy_received', f'Получено {req.amount} энергии от админа: {req.reason}', req.amount, ip_address)
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'success': True,
                            'target_user': target_nickname,
                            'amount': req.amount,
                            'new_energy': new_energy
                        })
                    }
            
            elif action == 'ban_user':
                target_email = body.get('target_email')
                
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM users WHERE email = %s OR nickname = %s", (target_email, target_email))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'message': 'Пользователь удален'})
                    }
        
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Неверный запрос'})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        conn.close()
