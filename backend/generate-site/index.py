import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generate website code (HTML, CSS, JS) based on user description using Groq AI
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
    
    api_key = os.environ.get('GROQ_API_KEY') or os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'API key not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        import requests
        
        prompt = f"""Создай HTML сайт: {description}

Верни ТОЛЬКО JSON: {{"html": "...", "css": "...", "js": "..."}}
HTML с <!DOCTYPE html>, полная страница.
Если игра - добавь всю логику в JS.
Минимум текста, максимум кода."""

        # Detect if using Groq or OpenAI
        api_url = 'https://api.groq.com/openai/v1/chat/completions' if 'gsk_' in api_key else 'https://api.openai.com/v1/chat/completions'
        model = 'llama-3.1-8b-instant' if 'gsk_' in api_key else 'gpt-4o-mini'

        response = requests.post(
            api_url,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model,
                'messages': [
                    {
                        'role': 'system',
                        'content': 'Веб-разработчик. Возвращай ТОЛЬКО JSON: {"html":"...","css":"...","js":"..."}. Без текста!'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7,
                'max_tokens': 4000
            },
            timeout=25
        )
        
        if response.status_code != 200:
            error_detail = response.text
            if response.status_code == 403:
                error_detail = 'API ключ недействителен или заблокирован. Создайте новый ключ на console.groq.com'
            elif response.status_code == 401:
                error_detail = 'API ключ неверный. Проверьте, что вы скопировали его полностью'
            
            return {
                'statusCode': response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': error_detail}),
                'isBase64Encoded': False
            }
        
        ai_response = response.json()
        generated_text = ai_response['choices'][0]['message']['content'].strip()
        
        # Try to extract JSON from markdown blocks
        if '```json' in generated_text:
            generated_text = generated_text.split('```json')[1].split('```')[0].strip()
        elif '```' in generated_text:
            generated_text = generated_text.split('```')[1].split('```')[0].strip()
        
        # Remove any leading/trailing text
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            generated_text = generated_text[start_idx:end_idx+1]
        
        generated_code = json.loads(generated_text)
        
        # Ensure all fields exist
        html_code = generated_code.get('html', '')
        css_code = generated_code.get('css', '')
        js_code = generated_code.get('js', '')
        
        if not html_code:
            raise ValueError('Generated HTML is empty')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'html': html_code,
                'css': css_code,
                'js': js_code,
                'description': description
            }),
            'isBase64Encoded': False
        }
        
    except json.JSONDecodeError as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Failed to parse AI response: {str(e)}', 'raw': generated_text[:500]}),
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