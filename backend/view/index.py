import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Отображение опубликованного сайта по ID проекта
    Args: event - dict с httpMethod, pathParams['id']
          context - object с request_id
    Returns: HTML страницу проекта
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}
    project_id = params.get('id')
    
    if not project_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'},
            'body': '<h1>Error: Project ID is required</h1><p>Add ?id=your-project-id to the URL</p>',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'},
            'body': '<h1>Error: Database not configured</h1>',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT html_code, css_code, js_code FROM projects WHERE id = %s", (project_id,))
    project = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not project:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'},
            'body': '<h1>404 - Project Not Found</h1><p>The project you are looking for does not exist.</p>',
            'isBase64Encoded': False
        }
    
    html_code = project['html_code']
    css_code = project['css_code']
    js_code = project['js_code']
    
    full_html = html_code.replace('</head>', f'<style>{css_code}</style></head>').replace('</body>', f'<script>{js_code}</script></body>')
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'},
        'body': full_html,
        'isBase64Encoded': False
    }
