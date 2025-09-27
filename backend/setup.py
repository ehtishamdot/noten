#!/usr/bin/env python3
"""
Setup script for Note Ninjas backend
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed:")
        print(f"  Error: {e.stderr}")
        return False


def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("✗ Python 3.8 or higher is required")
        print(f"  Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print(f"✓ Python version {version.major}.{version.minor}.{version.micro} is compatible")
    return True


def create_virtual_environment():
    """Create virtual environment"""
    if not run_command("python -m venv venv", "Creating virtual environment"):
        return False
    
    # Determine activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = "venv\\Scripts\\activate"
        pip_command = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        activate_script = "source venv/bin/activate"
        pip_command = "venv/bin/pip"
    
    print(f"\nVirtual environment created. To activate:")
    print(f"  {activate_script}")
    
    return True, activate_script, pip_command


def install_dependencies(pip_command):
    """Install Python dependencies"""
    if not run_command(f"{pip_command} install --upgrade pip", "Upgrading pip"):
        return False
    
    if not run_command(f"{pip_command} install -r requirements.txt", "Installing dependencies"):
        return False
    
    return True


def create_directories():
    """Create necessary directories"""
    backend_dir = Path(__file__).parent
    
    directories = [
        "vector_store",
        "feedback_storage",
        "logs"
    ]
    
    for directory in directories:
        dir_path = backend_dir / directory
        dir_path.mkdir(exist_ok=True)
        print(f"✓ Created directory: {directory}")


def create_env_file():
    """Create .env file if it doesn't exist"""
    backend_dir = Path(__file__).parent
    env_file = backend_dir / ".env"
    
    if env_file.exists():
        print("✓ .env file already exists")
        return
    
    env_example = backend_dir / "env.example"
    if env_example.exists():
        # Copy example to .env
        with open(env_example, 'r') as f:
            content = f.read()
        
        with open(env_file, 'w') as f:
            f.write(content)
        
        print("✓ Created .env file from env.example")
    else:
        # Create basic .env file
        basic_env = """# Note Ninjas Backend Configuration
NOTE_NINJAS_PATH=../NoteNinjas
TITLED_CPG_PATH=../Titled_CPGs
UNTITLED_CPG_PATH=../Untitled_CPGs
VECTOR_STORE_PATH=./vector_store
ALLOWED_ORIGINS=["http://localhost:3000"]
LOG_LEVEL=INFO
"""
        with open(env_file, 'w') as f:
            f.write(basic_env)
        
        print("✓ Created basic .env file")


def check_document_paths():
    """Check if document paths exist"""
    backend_dir = Path(__file__).parent
    
    paths_to_check = [
        ("Note Ninjas", backend_dir.parent / "NoteNinjas"),
        ("Titled CPGs", backend_dir.parent / "Titled_CPGs"),
        ("Untitled CPGs", backend_dir.parent / "Untitled_CPGs")
    ]
    
    missing_paths = []
    
    for name, path in paths_to_check:
        if path.exists():
            file_count = len(list(path.glob("**/*")))
            print(f"✓ {name} directory found ({file_count} files)")
        else:
            print(f"⚠ {name} directory not found: {path}")
            missing_paths.append((name, path))
    
    if missing_paths:
        print(f"\n⚠ Warning: {len(missing_paths)} document directories not found:")
        for name, path in missing_paths:
            print(f"  - {name}: {path}")
        print("\nThe backend will still work, but may not have documents to process.")
        print("Make sure your document directories are in the correct locations.")
    
    return len(missing_paths) == 0


def main():
    """Main setup function"""
    print("=== Note Ninjas Backend Setup ===\n")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create virtual environment
    venv_result = create_virtual_environment()
    if isinstance(venv_result, tuple):
        activate_script, pip_command = venv_result[1:]
    else:
        print("Failed to create virtual environment")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies(pip_command):
        print("Failed to install dependencies")
        sys.exit(1)
    
    # Create directories
    print("\nCreating directories...")
    create_directories()
    
    # Create .env file
    print("\nSetting up configuration...")
    create_env_file()
    
    # Check document paths
    print("\nChecking document paths...")
    check_document_paths()
    
    print("\n=== Setup Complete! ===")
    print("\nNext steps:")
    print(f"1. Activate virtual environment: {activate_script}")
    print("2. Run demo: python demo.py")
    print("3. Start server: python run.py")
    print("4. Test API: http://localhost:8000/docs")
    
    print("\nFor production deployment:")
    print("1. Update .env file with production settings")
    print("2. Use a proper WSGI server (e.g., Gunicorn)")
    print("3. Set up proper logging and monitoring")


if __name__ == "__main__":
    main()
