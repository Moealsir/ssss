import os
import json
import asyncio
import random
from telethon import TelegramClient, functions
from telethon.errors import (
    SessionPasswordNeededError, RPCError, ChatAdminRequiredError, PeerIdInvalidError
)
from telethon.tl.functions.channels import (
    CreateChannelRequest, 
    EditAdminRequest, 
    TogglePreHistoryHiddenRequest
)
from telethon.tl.types import ChatAdminRights
from datetime import datetime, timedelta
import pandas as pd

# Load session data from JSON
with open('sessions.json', 'r') as f:
    sessions = json.load(f)

# Excel file to store created groups
GROUPS_FILE = 'created_groups.xlsx'

# Ensure the Excel file exists with the proper structure
if not os.path.exists(GROUPS_FILE):
    df = pd.DataFrame(columns=["Group Name", "Group Link", "Creation Date"])
    df.to_excel(GROUPS_FILE, index=False)

def generate_random_name():
    """Generate a random group name."""
    return f"Group_{random.randint(1000, 9999)}_{datetime.now().strftime('%H%M%S')}"

async def create_mega_group(session):
    api_id = int(session['api_id'])
    api_hash = session['api_hash']
    session_file = session['session_file']
    phone_number = session['phone_number']

    client = TelegramClient(session_file, api_id, api_hash)

    try:
        await client.start(phone_number)
        if not await client.is_user_authorized():
            print(f"Login required for {phone_number}")
            return

        group_name = generate_random_name()
        result = await client(CreateChannelRequest(
            title=group_name,
            about="This is a randomly generated group",
            megagroup=True
        ))

        group_id = result.chats[0].id

        # Set admin rights with additional permissions
        rights = ChatAdminRights(
            post_messages=True,
            invite_users=True,
            add_admins=True,
            pin_messages=True,
            change_info=True
        )
        await client(EditAdminRequest(group_id, 'me', rights, rank='Owner'))

        # Enable chat history for new members
        try:
            await client(TogglePreHistoryHiddenRequest(group_id, False))
            print(f"History enabled for group {group_name}")
        except RPCError as e:
            print(f"Skipping history toggle for {phone_number}: {e}")

        # Generate invite link with error handling
        try:
            invite = await client(functions.messages.ExportChatInviteRequest(peer=group_id))
            invite_link = invite.link
        except ChatAdminRequiredError:
            print(f"No permission to generate invite link for {group_name}")
            invite_link = "No permission to generate invite link"
        except PeerIdInvalidError:
            print(f"Invalid Peer ID for {group_name}")
            invite_link = "Invalid Peer, check group permissions"

        # Append group info to the Excel file
        df = pd.read_excel(GROUPS_FILE)
        df = df.append({
            "Group Name": group_name,
            "Group Link": invite_link,
            "Creation Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }, ignore_index=True)
        df.to_excel(GROUPS_FILE, index=False)

        print(f"Created group {group_name} with link: {invite_link}")

    except SessionPasswordNeededError:
        print(f"Password required for session {phone_number}. Please login manually.")
    except Exception as e:
        print(f"Error for session {phone_number}: {e}")
    finally:
        await client.disconnect()

async def run_task():
    """Run the task for all sessions."""
    tasks = [create_mega_group(session) for session in sessions]
    await asyncio.gather(*tasks)

def calculate_next_run():
    """Calculate the next random run time (twice a day)."""
    now = datetime.now()
    # Generate two random times in a day
    random_hours = random.sample(range(24), 2)
    next_times = [now.replace(hour=h, minute=random.randint(0, 59), second=0) for h in random_hours]
    # Ensure the next run is in the future
    next_run = min(t for t in next_times if t > now)
    return next_run

async def schedule_task():
    """Schedule the task to run twice a day at random times."""
    while True:
        next_run = calculate_next_run()
        wait_time = (next_run - datetime.now()).total_seconds()
        print(f"Next run scheduled at: {next_run}")
        await asyncio.sleep(wait_time)
        await run_task()

# Run the script
if __name__ == "__main__":
    asyncio.run(schedule_task())
