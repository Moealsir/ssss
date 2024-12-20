# src/gui/session_gui.py

import asyncio
from session_manager import SessionManager
import tkinter as tk
from tkinter import simpledialog, messagebox, ttk
import threading
import sqlite3
import re
from telethon import TelegramClient, events
from tkinter import messagebox
import pandas as pd
import json

class SessionGUI:
    def __init__(self, root):
        self.root = root
        self.session_manager = SessionManager()
        self.tree = None

    def create_widgets(self, parent):
        # Create Treeview
        self.tree = ttk.Treeview(parent, columns=("name", "phone", "status"), show="headings")
        self.tree.heading("name", text="Session Name", anchor=tk.CENTER)
        self.tree.heading("phone", text="Phone Number", anchor=tk.CENTER)
        self.tree.heading("status", text="Status", anchor=tk.CENTER)
        
        self.tree.column("name", anchor=tk.CENTER)
        self.tree.column("phone", anchor=tk.CENTER)
        self.tree.column("status", anchor=tk.CENTER)
        
        self.tree.pack(fill=tk.BOTH, expand=1)

        # Create buttons
        btn_frame = tk.Frame(parent)
        btn_frame.pack(fill=tk.X)
        
        add_btn = tk.Button(btn_frame, text="Add Session", command=self.add_session)
        add_btn.pack(side=tk.LEFT, fill=tk.X, expand=1)

        remove_btn = tk.Button(btn_frame, text="Remove Session", command=self.remove_session)
        remove_btn.pack(side=tk.LEFT, fill=tk.X, expand=1)

        status_btn = tk.Button(btn_frame, text="Check Status", command=self.check_status)
        status_btn.pack(side=tk.LEFT, fill=tk.X, expand=1)

        fetch_code_btn = tk.Button(btn_frame, text="Get Code", command=self.fetch_code_from_number)
        fetch_code_btn.pack(side=tk.LEFT, fill=tk.X, expand=1)

        update_name_btn = tk.Button(btn_frame, text="Update Name", command=self.update_session_name)
        update_name_btn.pack(side=tk.LEFT, fill=tk.X, expand=1)

        export_button = tk.Button(btn_frame, text="Export Sessions", command=export_sessions)
        export_button.pack(pady=10)

        self.load_sessions()

    def create_join_widgets(self, parent):
        tk.Label(parent, text="Enter groups/channels (one per line):").pack(pady=10)

        self.join_text = tk.Text(parent, height=10)
        self.join_text.pack(fill=tk.BOTH, padx=10)

        join_btn = tk.Button(parent, text="Join", command=self.join_chats)
        join_btn.pack(pady=10)

    def join_chats(self):
        groups_channels = self.join_text.get("1.0", tk.END).strip().split("\n")
        
        if not groups_channels:
            messagebox.showwarning("No Input", "Please enter at least one group or channel.")
            return
        
        async def join():
            for group_channel in groups_channels:
                try:
                    await self.session_manager.join_channel(group_channel)
                    # Use lambda with default argument to capture the group_channel variable
                    self.root.after(0, lambda channel=group_channel: messagebox.showinfo("Success", f"Successfully joined {channel}"))
                except Exception as e:
                    # Use lambda with default argument to capture the exception variable
                    self.root.after(0, lambda error=e: messagebox.showerror("Error", f"Failed to join {group_channel}: {error}"))
        
        threading.Thread(target=lambda: asyncio.run(join())).start()


    def load_sessions(self):
        def run_async():
            async def load():
                sessions = await self.session_manager.get_sessions()
                return sessions

            def update_tree(sessions):
                self.tree.delete(*self.tree.get_children())
                count = 0
                for session in sessions:
                    name, phone_number, status = session
                    status_color = 'green' if status == 'Active' else 'red'
                    self.tree.insert("", tk.END, values=(name, phone_number, status), tags=("status",))
                    self.tree.tag_configure("status", background=status_color)
                    
                    count += 1
                    # Insert an empty row after every 10 sessions
                    if count % 10 == 0:
                        self.tree.insert("", tk.END, values=("", "", ""), tags=("separator",))
                        self.tree.tag_configure("separator", background="white")

            sessions = asyncio.run(load())
            self.root.after(0, lambda: update_tree(sessions))  # Ensure GUI updates are done on the main thread

        threading.Thread(target=run_async).start()

    def center_window(self, window, width, height):
        screen_width = window.winfo_screenwidth()
        screen_height = window.winfo_screenheight()
        x = (screen_width / 2) - (width / 2)
        y = (screen_height / 2) - (height / 2)
        window.geometry(f'{width}x{height}+{int(x)}+{int(y)}')

    def add_session(self):
        add_window = tk.Toplevel(self.root)
        add_window.title("Add Session")
        self.center_window(add_window, 300, 250)

        tk.Label(add_window, text="Session Name").pack()
        name_entry = tk.Entry(add_window)
        name_entry.pack()

        tk.Label(add_window, text="API ID").pack()
        api_id_entry = tk.Entry(add_window)
        api_id_entry.pack()

        tk.Label(add_window, text="API Hash").pack()
        api_hash_entry = tk.Entry(add_window)
        api_hash_entry.pack()

        tk.Label(add_window, text="Phone Number").pack()
        phone_entry = tk.Entry(add_window)
        phone_entry.pack()

        def save_session():
            name = name_entry.get()
            api_id = api_id_entry.get()
            api_hash = api_hash_entry.get()
            phone_number = phone_entry.get()

            def run_async():
                asyncio.run(self.session_manager.add_session(name, api_id, api_hash, phone_number, ''))
                self.load_sessions()

            threading.Thread(target=run_async).start()
            add_window.destroy()

        save_btn = tk.Button(add_window, text="Save", command=save_session)
        save_btn.pack()

    def update_session_name(self):
        selected_item = self.tree.selection()
        if selected_item:
            old_values = self.tree.item(selected_item[0])["values"]
            if old_values:
                session_id = self.get_session_id_by_values(old_values)  # Implement this method to get the session ID from the values
                if session_id:
                    update_window = tk.Toplevel(self.root)
                    update_window.title("Update Session Name")
                    self.center_window(update_window, 300, 100)

                    tk.Label(update_window, text="New Session Name").pack()
                    name_entry = tk.Entry(update_window)
                    name_entry.pack()
                    name_entry.insert(0, old_values[0])  # Set current name as default

                    def save_new_name():
                        new_name = name_entry.get()
                        def run_async():
                            asyncio.run(self.session_manager.update_session_name(session_id, new_name))
                            self.root.after(0, self.load_sessions)  # Refresh session list

                        threading.Thread(target=run_async).start()
                        update_window.destroy()

                    save_btn = tk.Button(update_window, text="Save", command=save_new_name)
                    save_btn.pack()
        else:
            messagebox.showwarning("No selection", "Please select a session to update.")

    def remove_session(self):
        selected_item = self.tree.selection()
        if selected_item:
            session_values = self.tree.item(selected_item[0])["values"]
            if session_values:
                session_id = self.get_session_id_by_values(session_values)
                if session_id:
                    def run_async():
                        asyncio.run(self.session_manager.remove_session(session_id))
                        self.load_sessions()

                    threading.Thread(target=run_async).start()
                else:
                    messagebox.showwarning("Session Not Found", "Session ID not found in the database.")
        else:
            messagebox.showwarning("No selection", "Please select a session to remove.")

    def check_status(self):
        selected_item = self.tree.selection()
        if selected_item:
            session_values = self.tree.item(selected_item[0])["values"]
            if session_values:
                session_id = self.get_session_id_by_values(session_values)
                if session_id:
                    def run_async():
                        async def fetch_session_details():
                            with sqlite3.connect(self.session_manager.db_path) as conn:
                                c = conn.cursor()
                                c.execute('SELECT id, name, phone_number, session_file, api_id, api_hash FROM sessions WHERE id=?', (session_id,))
                                session = c.fetchone()
                                return session

                        session = asyncio.run(fetch_session_details())
                        if session:
                            session_num, name, phone_number, session_file, api_id, api_hash = session
                            status = asyncio.run(self.session_manager.check_session_status(session_file, api_id, api_hash))
                            
                            # Create a new window for displaying details
                            details_window = tk.Toplevel(self.root)
                            details_window.title(f"Session {session_num} Details")
                            self.center_window(details_window, 360, 300)  # Increased width by 60 in total

                            # Displaying details with copy buttons
                            details = {
                                "Session Number": session_num,
                                "Name": name,
                                "Phone Number": phone_number,
                                "Status": status,
                                "API ID": api_id,
                                "API Hash": api_hash
                            }

                            for key, value in details.items():
                                row_frame = tk.Frame(details_window)
                                row_frame.pack(fill=tk.X, padx=5, pady=5)

                                tk.Label(row_frame, text=f"{key}:").pack(side=tk.LEFT)
                                value_label = tk.Label(row_frame, text=value, anchor="w")
                                value_label.pack(side=tk.LEFT, fill=tk.X, expand=True)

                                if key in ["Phone Number", "API ID", "API Hash"]:
                                    copy_button = tk.Button(row_frame, text="copy", command=lambda v=value: self.copy_to_clipboard(v))
                                    copy_button.pack(side=tk.LEFT, padx=5)

                        else:
                            messagebox.showwarning("Session Not Found", "Session ID not found in the database.")

                    threading.Thread(target=run_async).start()
                else:
                    messagebox.showwarning("Session Not Found", "Session ID not found in the database.")
        else:
            messagebox.showwarning("No selection", "Please select a session to check status.")

    def copy_to_clipboard(self, value):
        self.root.clipboard_clear()
        self.root.clipboard_append(value)
        self.root.update()  # Keeps the clipboard content even after the window is closed
        messagebox.showinfo("Copied", f"Copied to clipboard: {value}")


    def fetch_code_from_number(self):
        selected_item = self.tree.selection()
        if selected_item:
            session_id = self.tree.item(selected_item[0])["values"]
            if session_id:
                session_id = self.get_session_id_by_values(session_id)  # Implement this method to get the session ID from the values
                def run_async():
                    async def fetch_session_details():
                        with sqlite3.connect(self.session_manager.db_path) as conn:
                            c = conn.cursor()
                            c.execute('SELECT session_file, api_id, api_hash FROM sessions WHERE id=?', (session_id,))
                            session = c.fetchone()
                            return session

                    session = asyncio.run(fetch_session_details())
                    if session:
                        session_file, api_id, api_hash = session

                        async def watch_messages():
                            client = TelegramClient(session_file, api_id, api_hash)

                            @client.on(events.NewMessage(incoming=True))
                            async def handle_incoming_message(event):
                                sender = await event.get_sender()
                                sender_phone = getattr(sender, 'phone', None)
                                message_text = event.message.text

                                patterns = [
                                    r'login code:\s*([A-Za-z0-9]+)',  # For alphanumeric codes
                                    r'Your login code:\s*([A-Za-z0-9]+)',  # Another common pattern
                                    r'Web login code:\s*([A-Za-z0-9]+)',  # For messages with Web login code
                                    r'login code:\s*(\d+)',  # Numeric codes
                                ]

                                for pattern in patterns:
                                    match = re.search(pattern, message_text, re.IGNORECASE)
                                    if match:
                                        code = match.group(1)
                                        self.root.after(0, lambda: self.show_code_dialog(code))
                                        await client.disconnect()  # Stop after finding the code
                                        return

                            await client.connect()
                            print("Started watching messages.")
                            await client.run_until_disconnected()

                        asyncio.run(watch_messages())
                    else:
                        self.root.after(0, lambda: messagebox.showwarning("Session Not Found", "Session ID not found in the database."))

                threading.Thread(target=run_async).start()
        else:
            messagebox.showwarning("No selection", "Please select a session to fetch code.")

    def show_code_dialog(self, code):
        messagebox.showinfo("Login Code", f"Your Code: {code}")

    def get_session_id_by_values(self, values):
        # Only use columns that exist in the database
        with sqlite3.connect(self.session_manager.db_path) as conn:
            c = conn.cursor()
            c.execute('SELECT id FROM sessions WHERE name=? AND phone_number=?', values[:2])
            result = c.fetchone()
            if result:
                return result[0]
        return None
    
# Function to extract sessions.db into Excel and JSON
def export_sessions():
    try:
        # Connect to the database
        conn = sqlite3.connect('sessions.db')
        
        # Query the sessions table
        df = pd.read_sql_query("SELECT * FROM sessions", conn)
        
        # Export to Excel
        df.to_excel('sessions.xlsx', index=False)
        
        # Export to JSON
        df.to_json('sessions.json', orient='records', indent=4)
        
        # Close the connection
        conn.close()
        
        # Notify the user
        messagebox.showinfo("Export Successful", "Data has been exported to sessions.xlsx and sessions.json")
    except Exception as e:
        messagebox.showerror("Export Failed", f"An error occurred: {str(e)}")

