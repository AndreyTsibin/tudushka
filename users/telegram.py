import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl


def verify_telegram_init_data(init_data: str, bot_token: str):
    """Verify Telegram WebApp initData string.

    Returns parsed data dict if valid, otherwise None.
    """
    data = dict(parse_qsl(init_data, strict_parsing=True))
    hash_value = data.pop('hash', None)
    if not hash_value:
        return None
    data_check = '\n'.join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hmac.new(b'WebAppData', bot_token.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check.encode(), hashlib.sha256).hexdigest()
    if calculated_hash != hash_value:
        return None
    auth_date = int(data.get('auth_date', '0'))
    if time.time() - auth_date > 24 * 60 * 60:
        return None
    if 'user' in data:
        try:
            data['user'] = json.loads(data['user'])
        except Exception:
            return None
    return data
