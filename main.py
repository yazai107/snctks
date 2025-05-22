import sys
import os
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl, Qt, QThread, pyqtSignal
import subprocess
import signal
import atexit
#from core.chatbot import Chatbot
#from core.image_generator import ImageGenerator
#from core.settings import SettingsManager
from huggingface_hub import login
import server
import threading
import time

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Peixonauta")
        self.setMinimumSize(1000, 600)
        self.setWindowFlags(Qt.FramelessWindowHint)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        
        self.web_view = QWebEngineView()
        layout.addWidget(self.web_view)
        
        print("Starting Flask server...")
        creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
        self.flask_process = subprocess.Popen(
            [sys.executable, 'server.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            creationflags=creationflags
        )
        print(f"Flask server started with PID: {self.flask_process.pid}")
        
        self.flask_output_thread = threading.Thread(target=self.read_flask_output, daemon=True)
        self.flask_output_thread.start()
        
        time.sleep(2)
        
        atexit.register(self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)
        signal.signal(signal.SIGINT, self.cleanup)
        
        self.web_view.setUrl(QUrl("http://localhost:8000"))

    def read_flask_output(self):
        """Reads stdout and stderr from the Flask process and prints it."""
        for line in iter(self.flask_process.stdout.readline, ''):
            print(f"[FLASK_STDOUT] {line.strip()}")
        for line in iter(self.flask_process.stderr.readline, ''):
            print(f"[FLASK_STDERR] {line.strip()}")

    def closeEvent(self, event):
        self.cleanup()
        event.accept()
        
    def cleanup(self, signum=None, frame=None):
        print("Shutting down Flask server...")
        if hasattr(self, 'flask_process') and self.flask_process:
            try:
                self.flask_process.terminate()
                self.flask_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.flask_process.kill()
                self.flask_process.wait()
            print("Flask server shut down.")
            self.flask_process = None

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()