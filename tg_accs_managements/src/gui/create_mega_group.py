import os
import json
import asyncio
from telethon import TelegramClient
from telethon.errors import (
    SessionPasswordNeededError, RPCError
)
from telethon.tl.functions.channels import (
    CreateChannelRequest, 
    EditAdminRequest, 
    TogglePreHistoryHiddenRequest
)
from telethon.tl.types import ChatAdminRights
from datetime import datetime
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

async def create_mega_group(session):
    api_id = int(session['api_id'])
    api_hash = session['api_hash']
    session_file = session['session_file']
    phone_number = session['phone_number']

    client = TelegramClient(session_file, api_id, api_hash)

    try:
        # Start the client and authenticate
        await client.start(phone_number)
        if not await client.is_user_authorized():
            print(f"Login required for {phone_number}")
            return

        # Create the private group (channel)
        result = await client(CreateChannelRequest(
            title=f"test group {session['id']}",
            about="This is a sos group",
            megagroup=True
        ))

        group_id = result.chats[0].id
        group_name = result.chats[0].title

        # Convert to a mega group and set admin rights
        rights = ChatAdminRights(post_messages=True, invite_users=True, add_admins=True)
        await client(EditAdminRequest(group_id, 'me', rights, rank='Owner'))

        # Attempt to enable chat history for new members
        try:
            await client(TogglePreHistoryHiddenRequest(group_id, False))
            print(f"History enabled for group {group_name}")
        except RPCError as e:
            print(f"Skipping history toggle for {phone_number}: {e}")

        # Get the group link (invite link)
        invite = await client.export_chat_invite_link(group_id)

        # Append group info to the Excel file
        df = pd.read_excel(GROUPS_FILE)
        df = df.append({
            "Group Name": group_name,
            "Group Link": invite,
            "Creation Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }, ignore_index=True)
        df.to_excel(GROUPS_FILE, index=False)

        print(f"Created group {group_name} with link: {invite}")

    except SessionPasswordNeededError:
        print(f"Password required for session {phone_number}. Please login manually.")
    except Exception as e:
        print(f"Error for session {phone_number}: {e}")
    finally:
        await client.disconnect()

async def main():
    tasks = [create_mega_group(session) for session in sessions]
    await asyncio.gather(*tasks)

# Run the script
if __name__ == "__main__":
    asyncio.run(main())
