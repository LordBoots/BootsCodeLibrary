import http.server
import os
import sys
import time
import threading
import logging

# Configure logging
logging.basicConfig(filename='server.log', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.end_headers()

    def log_message(self, format, *args):
        logging.info("%s - %s" % (self.address_string(), format % args))

    def handle(self):
        try:
            super().handle()
        except ConnectionResetError:
            logging.error("Client disconnected unexpectedly.")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")

def console_output():
    while True:
        print("Server is running...")
        time.sleep(30)

def print_assets(folder):
    print(f"Assets found in the folder '{folder}':")
    logging.debug(f"Starting to walk through the folder: {folder}")
    total_files_shown = 0
    for root, dirs, files in os.walk(folder):
        logging.debug(f"Current directory: {root}")
        # Exclude .git directory
        if '.git' in dirs:
            dirs.remove('.git')
        for file in files:
            logging.debug(f"Found file: {file}")
            print(f"- {os.path.join(root, file)}")
            total_files_shown += 1
    # Logging the total number of files shown for verification
    logging.info(f"Total number of files shown: {total_files_shown}")
    print(f"Total number of files shown: {total_files_shown}")

def start_server():
    folder = os.getcwd()  # Serve the current working directory
    print_assets(folder)
    
    # Start the console output thread
    thread = threading.Thread(target=console_output, daemon=True)
    thread.start()
    
    # Start the user input thread
    input_thread = threading.Thread(target=user_input, daemon=True)
    input_thread.start()
    
    port = 8000
    logging.info(f"Starting server in folder: {os.getcwd()} on port: {port}")
    try:
        http.server.HTTPServer(("", port), CORSRequestHandler).serve_forever()
    except PermissionError:
        logging.error(f"No permission to use port {port}. Try a port number above 1024.")
        sys.exit(1)
    except OSError as e:
        logging.error(f"Error: {e}")
        sys.exit(1)

def user_input():
    while True:
        folder = input("Enter the directory name to print its contents: ")
        if os.path.isdir(folder):
            print_assets(folder)
        else:
            print(f"The directory '{folder}' does not exist.")

if __name__ == "__main__":
    start_server()
