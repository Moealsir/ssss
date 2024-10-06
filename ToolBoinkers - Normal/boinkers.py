import requests
import os
import json
import time

get_user_info_url = "https://boink.astronomica.io/api/users/me?p=ios"
get_rewarded_action_list_url = "https://boink.astronomica.io/api/rewardedActions/getRewardedActionList?p=ios"
claim_reward_url = "https://boink.astronomica.io/api/rewardedActions/claimRewardedAction/SeveralHourlsReward?p=ios"
spin_slot_machine_url = "https://boink.astronomica.io/api/play/spinSlotMachine/10?p=ios"
upgrade_boinker_url = "https://boink.astronomica.io/api/boinkers/upgradeBoinker?p=ios"

def clear_console():
    os.system("cls" if os.name == "nt" else "clear")

def generate_timestamp():
    return int(time.time() * 1000)

def read_token_ids_from_file(filename):
    with open(filename, 'r') as file:
        token_ids = [line.strip() for line in file.readlines()]
    return token_ids

def get_user_info(token_id):
    headers = {
        "authority": "boink.astronomica.io",
        "method": "GET",
        "path": "/api/users/me?p=ios",
        "scheme": "https",
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
        "authorization": token_id,
        "priority": "u=1, i",
        "referer": "https://boink.astronomica.io/",
        "sec-ch-ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(get_user_info_url, headers=headers)
        if response.status_code == 200:
            response_data = response.json()
            username = response_data.get("userName", "N/A")
            currency_soft = response_data.get("currencySoft", 0)
            currency_crypto = response_data.get("currencyCrypto", 0)
            print(f"[*] Tài khoản: {username}.")
            print(f"[*] Số vàng hiện tại: {currency_soft}.")
            print(f"[*] Số điểm hiện tại: {currency_crypto}.")
        else:
            print(f"[*] Hiện tại không thể truy xuất được dữ liệu cho tài khoản.")
    except requests.exceptions.RequestException as e:
        print(f"[*] Đã xảy ra lỗi khi truy xuất dữ liệu thông tin cho tài khoản!")

def get_rewarded_action_list(token_id, timestamp):
    headers = {
        "authority": "boink.astronomica.io",
        "method": "GET",
        "path": f"/api/rewardedActions/getRewardedActionList?p=ios&t={timestamp}",
        "scheme": "https",
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
        "authorization": token_id,
        "priority": "u=1, i",
        "referer": "https://boink.astronomica.io/sluts",
        "sec-ch-ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(f"{get_rewarded_action_list_url}&t={timestamp}", headers=headers)
        if response.status_code == 200:
            response_data = response.json()
            name_ids = [action.get("nameId") for action in response_data]
            return name_ids
        else:
            print(f"[*] Hiện tại không thể truy xuất dữ liệu danh sách nhiệm vụ cho tài khoản.")
            return []
    except requests.exceptions.RequestException as e:
        print(f"[*] Đã xảy ra lỗi khi truy xuất dữ liệu danh sách nhiệm vụ cho tài khoản!")
        return []

def claim_hourly_reward(token_id, name_ids):
    headers = {
        "authority": "boink.astronomica.io",
        "method": "POST",
        "scheme": "https",
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
        "authorization": token_id,
        "content-type": "application/json",
        "origin": "https://boink.astronomica.io",
        "priority": "u=1, i",
        "referer": "https://boink.astronomica.io/earn",
        "sec-ch-ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }
    mission_success = []
    mission_errors = []
    for name_id in name_ids:
        try:
            response = requests.post(f"{claim_reward_url.replace('SeveralHourlsReward', name_id)}", headers=headers, data="{}")
            if response.status_code == 200:
                mission_success.append(name_id)
            else:
                mission_errors.append(name_id)
        except requests.exceptions.RequestException as e:
            mission_errors.append(name_id)
    if mission_success:
        print(f"[*] Đã hoàn thành xong thành công tất cả nhiệm vụ cho tài khoản.")
    if mission_errors:
        print(f"[*] Hiện tại không thể hoàn thành một số nhiệm vụ cho tài khoản.")

def spin_slot_machine(token_id):
    headers = {
        "authority": "boink.astronomica.io",
        "method": "POST",
        "path": "/api/play/spinSlotMachine/10?p=ios",
        "scheme": "https",
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
        "authorization": token_id,
        "content-length": "2",
        "content-type": "application/json",
        "origin": "https://boink.astronomica.io",
        "priority": "u=1, i",
        "referer": "https://boink.astronomica.io/sluts",
        "sec-ch-ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }
    try:
        response = requests.post(spin_slot_machine_url, headers=headers, data="{}")
        if response.status_code == 200:
            print(f"[*] Đã thực hiện vòng quay may mắn thành công cho tài khoản.")
        else:
            print(f"[*] Hiện tại không thể thực hiện vòng quay may mắn thành công cho tài khoản.")
    except requests.exceptions.RequestException as e:
        print(f"[*] Đã xảy ra lỗi khi thực hiện vòng quay may mắn thành công cho tài khoản!")

def upgrade_boinker(token_id):
    headers = {
        "authority": "boink.astronomica.io",
        "method": "POST",
        "path": "/api/boinkers/upgradeBoinker?p=ios",
        "scheme": "https",
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
        "authorization": token_id,
        "content-length": "2",
        "content-type": "application/json",
        "origin": "https://boink.astronomica.io",
        "priority": "u=1, i",
        "referer": "https://boink.astronomica.io/upgrade-boinker",
        "sec-ch-ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }
    try:
        response = requests.post(upgrade_boinker_url, headers=headers, data="{}")
        if response.status_code == 200:
            print(f"[*] Đã nâng cấp tốc độ khai thác thành công cho tài khoản.")
        else:
            print(f"[*] Hiện tại không thể nâng cấp tốc độ khai thác thành công cho tài khoản.")
    except requests.exceptions.RequestException as e:
        print(f"[*] Đã xảy ra lỗi khi nâng cấp tốc độ khai thác thành công cho tài khoản.")

def main():
    while True:
        clear_console()
        timestamp = generate_timestamp()
        token_ids = read_token_ids_from_file('data.txt')
        for token_id in token_ids:
            print("-" * 60)
            get_user_info(token_id)
            name_ids = get_rewarded_action_list(token_id, timestamp)
            claim_hourly_reward(token_id, name_ids)
            spin_slot_machine(token_id)
            upgrade_boinker(token_id)
        print("-" * 60)
        print(f"[*] Đã hoàn thành xong tất cả tài khoản! Vui lòng đợi một xíu để tiếp tục vòng lặp.")
        time.sleep(600)

if __name__ == "__main__":
    main()
