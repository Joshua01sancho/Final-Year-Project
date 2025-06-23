#!/usr/bin/env python3
"""
E-Voting System Setup Script
Automatically configures environment, database, and initial setup
"""

import os
import subprocess
import sys
from pathlib import Path

def create_env_file():
    """Create .env file with default configuration"""
    env_content = """# Django Settings
SECRET_KEY=django-insecure-e-voting-system-2024-secure-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database Settings (PostgreSQL)
DB_NAME=evoting
DB_USER=postgres
DB_PASSWORD=evoting_password_2024
DB_HOST=localhost
DB_PORT=5432

# Redis Settings
REDIS_URL=redis://localhost:6379/0

# Azure Face API Settings
AZURE_FACE_API_KEY=your-azure-face-api-key-here
AZURE_FACE_ENDPOINT=https://your-region.api.cognitive.microsoft.com/

# Blockchain Settings (Ethereum/Ganache)
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here

# Security Settings
PAILLIER_KEY_SIZE=2048
PAILLIER_THRESHOLD=3

# Email Settings (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# File Upload Settings
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif

# Rate Limiting
RATE_LIMIT_AUTH=5  # requests per 5 minutes
RATE_LIMIT_VOTE=1  # vote per hour per election
RATE_LIMIT_API=100  # requests per hour
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    print("✅ Created .env file with default configuration")

def setup_database():
    """Setup PostgreSQL database"""
    print("🔧 Setting up PostgreSQL database...")
    
    # Check if PostgreSQL is installed
    try:
        subprocess.run(['psql', '--version'], check=True, capture_output=True)
        print("✅ PostgreSQL is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ PostgreSQL not found. Please install PostgreSQL first.")
        print("   Download from: https://www.postgresql.org/download/")
        return False
    
    # Create database
    try:
        subprocess.run([
            'psql', '-U', 'postgres', '-h', 'localhost',
            '-c', 'CREATE DATABASE evoting;'
        ], check=True, capture_output=True)
        print("✅ Created 'evoting' database")
    except subprocess.CalledProcessError:
        print("⚠️  Database 'evoting' might already exist")
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False

def run_migrations():
    """Run Django migrations"""
    print("🔄 Running database migrations...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'makemigrations'], check=True)
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        print("✅ Database migrations completed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to run migrations")
        return False

def create_superuser():
    """Create Django superuser"""
    print("👤 Creating superuser...")
    try:
        subprocess.run([
            sys.executable, 'manage.py', 'createsuperuser',
            '--username', 'admin',
            '--email', 'admin@evoting.com',
            '--noinput'
        ], check=True, capture_output=True)
        print("✅ Created superuser: admin/admin@evoting.com")
        print("   Password: admin123 (change this immediately!)")
        return True
    except subprocess.CalledProcessError:
        print("⚠️  Superuser creation failed or already exists")
        return False

def setup_initial_data():
    """Setup initial data and groups"""
    print("📊 Setting up initial data...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'shell', '-c', '''
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.elections.models import Election
from apps.voters.models import VoterProfile

# Create groups
election_managers, _ = Group.objects.get_or_create(name='ElectionManagers')
voters, _ = Group.objects.get_or_create(name='Voters')

print("✅ Created user groups: ElectionManagers, Voters")
        '''], check=True)
        print("✅ Initial data setup completed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to setup initial data")
        return False

def main():
    """Main setup function"""
    print("🚀 E-Voting System Setup")
    print("=" * 50)
    
    # Create .env file
    create_env_file()
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Setup database
    if not setup_database():
        return
    
    # Run migrations
    if not run_migrations():
        return
    
    # Create superuser
    create_superuser()
    
    # Setup initial data
    setup_initial_data()
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your actual API keys and settings")
    print("2. Start the development server: python manage.py runserver")
    print("3. Access admin panel: http://localhost:8000/admin")
    print("4. Access API: http://localhost:8000/api/")

if __name__ == "__main__":
    main() 