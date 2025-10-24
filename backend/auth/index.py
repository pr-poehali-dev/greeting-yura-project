'''
Business: User authentication system with registration, login, and session management
Args: event - dict with httpMethod, body, headers; context - object with request_id
Returns: HTTP response with user data or error message
'''
import json
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, EmailStr, Field, ValidationError

DATABASE_URL = os.environ.get('DATABASE_URL', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-this-secret-key')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'CatStudio')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '1488')

class RegisterRequest(BaseModel):
    email: EmailStr
    nickname: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: str
    password: str

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: int, email: str, is_admin: bool) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def ensure_admin_exists(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (ADMIN_EMAIL,))
        if not cur.fetchone():
            hashed = hash_password(ADMIN_PASSWORD)
            cur.execute(
                "INSERT INTO users (email, nickname, password_hash, is_admin, energy) VALUES (%s, %s, %s, %s, %s)",
                (ADMIN_EMAIL, 'Admin', hashed, True, 999999)
            )
            conn.commit()

def log_user_action(conn, user_id: int, action_type: str, description: str, project_id: Optional[str], energy_change: int, ip_address: str):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO user_logs (user_id, action_type, action_description, project_id, energy_change, ip_address) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, action_type, description, project_id, energy_change, ip_address)
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
    
    conn = get_db_connection()
    ensure_admin_exists(conn)
    
    ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                reg_data = RegisterRequest(**body)
                
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM users WHERE email = %s OR nickname = %s", (reg_data.email, reg_data.nickname))
                    if cur.fetchone():
                        return {
                            'statusCode': 400,
                            'headers': headers,
                            'body': json.dumps({'error': 'Email или nickname уже заняты'})
                        }
                    
                    hashed = hash_password(reg_data.password)
                    cur.execute(
                        "INSERT INTO users (email, nickname, password_hash, energy) VALUES (%s, %s, %s, %s) RETURNING id, email, nickname, is_admin, energy",
                        (reg_data.email, reg_data.nickname, hashed, 500)
                    )
                    user = cur.fetchone()
                    conn.commit()
                    
                    user_id = user[0]
                    token = create_token(user_id, user[1], user[3])
                    
                    cur.execute(
                        "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (%s, %s, %s, %s, %s)",
                        (user_id, token, ip_address, event.get('headers', {}).get('User-Agent', ''), datetime.utcnow() + timedelta(days=30))
                    )
                    conn.commit()
                    
                    log_user_action(conn, user_id, 'register', f'Новый пользователь зарегистрирован: {reg_data.nickname}', None, 500, ip_address)
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'token': token,
                            'user': {
                                'id': user_id,
                                'email': user[1],
                                'nickname': user[2],
                                'is_admin': user[3],
                                'energy': user[4]
                            }
                        })
                    }
            
            elif action == 'login':
                login_data = LoginRequest(**body)
                
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id, email, nickname, password_hash, is_admin, energy FROM users WHERE email = %s",
                        (login_data.email,)
                    )
                    user = cur.fetchone()
                    
                    if not user or not verify_password(login_data.password, user[3]):
                        return {
                            'statusCode': 401,
                            'headers': headers,
                            'body': json.dumps({'error': 'Неверный email или пароль'})
                        }
                    
                    cur.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.utcnow(), user[0]))
                    conn.commit()
                    
                    token = create_token(user[0], user[1], user[4])
                    
                    cur.execute(
                        "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (%s, %s, %s, %s, %s)",
                        (user[0], token, ip_address, event.get('headers', {}).get('User-Agent', ''), datetime.utcnow() + timedelta(days=30))
                    )
                    conn.commit()
                    
                    log_user_action(conn, user[0], 'login', f'Вход в систему', None, 0, ip_address)
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'token': token,
                            'user': {
                                'id': user[0],
                                'email': user[1],
                                'nickname': user[2],
                                'is_admin': user[4],
                                'energy': user[5]
                            }
                        })
                    }
        
        elif method == 'GET':
            auth_header = event.get('headers', {}).get('X-Auth-Token', '')
            if not auth_header:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Не авторизован'})
                }
            
            payload = verify_token(auth_header)
            if not payload:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Невалидный токен'})
                }
            
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE sessions SET last_activity = %s WHERE token = %s",
                    (datetime.utcnow(), auth_header)
                )
                conn.commit()
                
                cur.execute(
                    "SELECT id, email, nickname, is_admin, energy, total_projects, total_publishes FROM users WHERE id = %s",
                    (payload['user_id'],)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Пользователь не найден'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'user': {
                            'id': user[0],
                            'email': user[1],
                            'nickname': user[2],
                            'is_admin': user[3],
                            'energy': user[4],
                            'total_projects': user[5],
                            'total_publishes': user[6]
                        }
                    })
                }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    except ValidationError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Ошибка валидации', 'details': e.errors()})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        conn.close()
