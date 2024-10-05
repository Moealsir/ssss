#!/bin/bash

while true; do
    python3 "$HOME/storage/shared/download/memefi/memefi.py"
    if [ $? -ne 0 ]; then
        echo "Script exited with error. Restarting..."
        sleep 2  # Tunggu beberapa detik sebelum restart
    else
        break  # Hentikan loop jika skrip berjalan sukses tanpa error
    fi
done
