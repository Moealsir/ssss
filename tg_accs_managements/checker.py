from telethon.sync import TelegramClient
from telethon.errors import PhoneNumberInvalidError, FloodWaitError
from telethon.tl.functions.contacts import ImportContactsRequest, DeleteContactsRequest
from telethon.tl.types import InputPhoneContact
import time

# Replace these with your own values
api_id = '26947079'
api_hash = 'c6ed223dce206c0a98037fb6a7e06ceb'

def check_telegram_number(client, phone_number):
    contact = InputPhoneContact(client_id=0, phone=phone_number, first_name="Temp", last_name="Contact")
    try:
        result = client(ImportContactsRequest([contact]))
        user = result.users[0] if result.users else None

        if user:
            print(f"{phone_number} is registered on Telegram.")
        else:
            print(f"{phone_number} is not registered on Telegram.")
        
        # Clean up: remove the contact after checking
        client(DeleteContactsRequest([user.id]))

    except IndexError:
        print(f"{phone_number} is not registered on Telegram.")
    except PhoneNumberInvalidError:
        print(f"{phone_number} is not a valid phone number.")
    except FloodWaitError as e:
        print(f"Rate limit hit. Please wait for {e.seconds} seconds.")
        time.sleep(e.seconds)

def main():
    with TelegramClient('session_name', api_id, api_hash) as client:
        while True:
            phone_number = input("Enter phone number (or type 'quit' to exit): ")
            if phone_number.lower() == 'quit':
                break
            check_telegram_number(client, phone_number)

if __name__ == "__main__":
    main()
