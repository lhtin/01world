import subprocess, sys, os

def run_sync (cmd):
  print(f"Run {cmd}")
  process = subprocess.Popen(cmd, shell=True, start_new_session=True)
  try:
    process.wait()
  except KeyboardInterrupt:
    print(f"Kill subprocess {process.pid} and it's children.")
    os.system(f"pkill --session {process.pid}")
    sys.exit(1)
