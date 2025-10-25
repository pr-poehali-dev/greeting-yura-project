import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generate website code (HTML, CSS, JS) based on user description using OpenAI
    Args: event with httpMethod, body containing description
          context with request_id attribute
    Returns: HTTP response with generated code
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    description: str = body_data.get('description', '')
    
    if not description:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Description is required'}),
            'isBase64Encoded': False
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OpenAI API key not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        import requests
        
        prompt = f"""Создай полный HTML сайт по описанию: {description}

Требования:
1. Верни ТОЛЬКО JSON в формате: {{"html": "...", "css": "...", "js": "..."}}
2. HTML должен быть полным (с <!DOCTYPE>, <html>, <head>, <body>)
3. CSS должен быть современным, красивым и адаптивным
4. JavaScript должен добавлять интерактивность
5. Используй только чистый JS (без библиотек)
6. Если описание про игру - создай полноценную рабочую игру
7. Код должен быть готов к использованию

Пример JSON ответа:
{{"html": "<!DOCTYPE html>...", "css": "body {{...}}", "js": "console.log('ready');"}}"""

        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'gpt-4o-mini',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'Ты эксперт по созданию веб-сайтов. Всегда возвращай только валидный JSON с ключами html, css, js. Никакого дополнительного текста.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7,
                'max_tokens': 4000
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'OpenAI API error: {response.text}'}),
                'isBase64Encoded': False
            }
        
        ai_response = response.json()
        generated_text = ai_response['choices'][0]['message']['content']
        
        # Extract JSON from response (handle markdown code blocks)
        if '```json' in generated_text:
            generated_text = generated_text.split('```json')[1].split('```')[0].strip()
        elif '```' in generated_text:
            generated_text = generated_text.split('```')[1].split('```')[0].strip()
        
        generated_code = json.loads(generated_text)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'html': generated_code.get('html', ''),
                'css': generated_code.get('css', ''),
                'js': generated_code.get('js', ''),
                'description': description
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Generation failed: {str(e)}'}),
            'isBase64Encoded': False
        }
