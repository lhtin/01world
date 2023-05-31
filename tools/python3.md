# Python3 笔记

- 强制终止子进程
  ```python3
  import subprocess, sys, os, argparse
  process = subprocess.Popen(cmd, shell=True, start_new_session=True)
  try:
    process.wait()
  except KeyboardInterrupt:
    os.system(f"pkill --session {process.pid}")
    sys.exit(1)
  ```
