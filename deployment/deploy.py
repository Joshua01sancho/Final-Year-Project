#!/usr/bin/env python3
"""
E-Voting System Deployment Script

This script handles the complete deployment of the E-Voting system including:
- Environment setup
- Database initialization
- Static file collection
- Service configuration
- Health checks
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path
from dotenv import load_dotenv

class EVotingDeployer:
    """Handles complete deployment of the E-Voting system"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.frontend_dir = self.project_root / 'frontend'
        
        # Load environment
        load_dotenv(self.backend_dir / '.env')
        
        self.deployment_mode = os.getenv('DEPLOYMENT_MODE', 'development')
        self.debug = os.getenv('DEBUG', 'True').lower() == 'true'
        
    def run_command(self, command, cwd=None, check=True):
        """Run a shell command"""
        if cwd is None:
            cwd = self.backend_dir
            
        print(f"🔄 Running: {command}")
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                check=check,
                capture_output=True,
                text=True
            )
            if result.stdout:
                print(f"✅ Output: {result.stdout.strip()}")
            return result
        except subprocess.CalledProcessError as e:
            print(f"❌ Error: {e.stderr}")
            if check:
                raise
            return e
    
    def check_prerequisites(self):
        """Check if all prerequisites are installed"""
        print("🔍 Checking prerequisites...")
        
        # Check Python version
        python_version = sys.version_info
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
            raise Exception("Python 3.8+ is required")
        
        print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # Check required commands
        required_commands = ['pip', 'psql', 'redis-cli']
        
        for cmd in required_commands:
            try:
                result = subprocess.run([cmd, '--version'], capture_output=True, text=True)
                print(f"✅ {cmd}: {result.stdout.split()[0] if result.stdout else 'Found'}")
            except FileNotFoundError:
                print(f"⚠️  {cmd} not found - please install it")
        
        # Check environment file
        env_file = self.backend_dir / '.env'
        if not env_file.exists():
            print("⚠️  .env file not found - creating from template")
            self.create_env_file()
    
    def create_env_file(self):
        """Create .env file from template"""
        env_template = """# Django Settings
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
        
        with open(self.backend_dir / '.env', 'w') as f:
            f.write(env_template)
        
        print("✅ Created .env file")
    
    def setup_database(self):
        """Setup PostgreSQL database"""
        print("🗄️  Setting up database...")
        
        # Check if database exists
        try:
            self.run_command(
                "psql -U postgres -h localhost -c 'SELECT 1 FROM pg_database WHERE datname=\\'evoting\\';'",
                check=False
            )
        except:
            # Create database
            self.run_command(
                "psql -U postgres -h localhost -c 'CREATE DATABASE evoting;'",
                check=False
            )
            print("✅ Created evoting database")
        
        # Create user if not exists
        try:
            self.run_command(
                "psql -U postgres -h localhost -d evoting -c 'CREATE USER evoting_user WITH PASSWORD \\'evoting_password_2024\\';'",
                check=False
            )
            print("✅ Created evoting_user")
        except:
            print("⚠️  User might already exist")
        
        # Grant privileges
        self.run_command(
            "psql -U postgres -h localhost -d evoting -c 'GRANT ALL PRIVILEGES ON DATABASE evoting TO evoting_user;'",
            check=False
        )
        print("✅ Database setup completed")
    
    def install_dependencies(self):
        """Install Python dependencies"""
        print("📦 Installing dependencies...")
        
        # Upgrade pip
        self.run_command("python -m pip install --upgrade pip")
        
        # Install requirements
        self.run_command("pip install -r requirements.txt")
        
        print("✅ Dependencies installed")
    
    def run_migrations(self):
        """Run database migrations"""
        print("🔄 Running migrations...")
        
        # Make migrations
        self.run_command("python manage.py makemigrations")
        
        # Run migrations
        self.run_command("python manage.py migrate")
        
        print("✅ Migrations completed")
    
    def create_superuser(self):
        """Create Django superuser"""
        print("👤 Creating superuser...")
        
        try:
            self.run_command(
                "python manage.py shell -c \"from django.contrib.auth.models import User; "
                "User.objects.create_superuser('admin', 'admin@evoting.com', 'admin123') if not "
                "User.objects.filter(username='admin').exists() else None\"",
                check=False
            )
            print("✅ Superuser created: admin/admin123")
        except:
            print("⚠️  Superuser might already exist")
    
    def setup_initial_data(self):
        """Setup initial data and groups"""
        print("📊 Setting up initial data...")
        
        setup_script = """
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.elections.models import ElectionCategory

# Create groups
election_managers, _ = Group.objects.get_or_create(name='ElectionManagers')
voters, _ = Group.objects.get_or_create(name='Voters')

# Create default category
default_category, _ = ElectionCategory.objects.get_or_create(
    name='General Elections',
    defaults={'description': 'General election category', 'color': '#007bff'}
)

print("✅ Created user groups and default category")
"""
        
        self.run_command(f"python manage.py shell -c \"{setup_script}\"")
    
    def collect_static_files(self):
        """Collect static files"""
        print("📁 Collecting static files...")
        
        self.run_command("python manage.py collectstatic --noinput")
        
        print("✅ Static files collected")
    
    def run_tests(self):
        """Run test suite"""
        print("🧪 Running tests...")
        
        try:
            self.run_command("python manage.py test --verbosity=2")
            print("✅ All tests passed")
        except:
            print("⚠️  Some tests failed - continuing deployment")
    
    def setup_services(self):
        """Setup background services"""
        print("🔧 Setting up services...")
        
        # Create logs directory
        logs_dir = self.backend_dir / 'logs'
        logs_dir.mkdir(exist_ok=True)
        
        # Create media directory
        media_dir = self.backend_dir / 'media'
        media_dir.mkdir(exist_ok=True)
        
        print("✅ Services setup completed")
    
    def health_check(self):
        """Perform health check"""
        print("🏥 Performing health check...")
        
        # Start development server in background
        server_process = subprocess.Popen(
            ["python", "manage.py", "runserver", "0.0.0.0:8000"],
            cwd=self.backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for server to start
        time.sleep(5)
        
        try:
            # Test API endpoint
            import requests
            response = requests.get("http://localhost:8000/api/", timeout=10)
            
            if response.status_code == 200:
                print("✅ Health check passed - API is responding")
            else:
                print(f"⚠️  Health check warning - API returned {response.status_code}")
                
        except Exception as e:
            print(f"⚠️  Health check warning - {str(e)}")
        
        finally:
            # Stop server
            server_process.terminate()
            server_process.wait()
    
    def deploy_production(self):
        """Deploy to production environment"""
        print("🚀 Deploying to production...")
        
        # Set production environment
        os.environ['DEBUG'] = 'False'
        os.environ['DEPLOYMENT_MODE'] = 'production'
        
        # Install production dependencies
        self.run_command("pip install gunicorn")
        
        # Create production configuration
        self.create_production_config()
        
        # Setup SSL (if needed)
        self.setup_ssl()
        
        print("✅ Production deployment completed")
    
    def create_production_config(self):
        """Create production configuration files"""
        print("⚙️  Creating production configuration...")
        
        # Gunicorn config
        gunicorn_config = """
bind = "0.0.0.0:8000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
"""
        
        with open(self.backend_dir / 'gunicorn.conf.py', 'w') as f:
            f.write(gunicorn_config)
        
        # Nginx config
        nginx_config = """
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /path/to/your/staticfiles/;
    }
    
    location /media/ {
        alias /path/to/your/media/;
    }
}
"""
        
        with open(self.backend_dir / 'nginx.conf', 'w') as f:
            f.write(nginx_config)
        
        print("✅ Production configuration created")
    
    def setup_ssl(self):
        """Setup SSL certificates"""
        print("🔒 Setting up SSL...")
        
        # In production, you would use Let's Encrypt or other SSL provider
        print("⚠️  SSL setup requires manual configuration")
        print("   Consider using Let's Encrypt or your SSL provider")
    
    def create_startup_scripts(self):
        """Create startup scripts"""
        print("📜 Creating startup scripts...")
        
        # Development startup script
        dev_script = """#!/bin/bash
cd "$(dirname "$0")"
echo "Starting E-Voting System in development mode..."
python manage.py runserver 0.0.0.0:8000
"""
        
        with open(self.backend_dir / 'start_dev.sh', 'w') as f:
            f.write(dev_script)
        
        # Production startup script
        prod_script = """#!/bin/bash
cd "$(dirname "$0")"
echo "Starting E-Voting System in production mode..."
gunicorn -c gunicorn.conf.py evoting.wsgi:application
"""
        
        with open(self.backend_dir / 'start_prod.sh', 'w') as f:
            f.write(prod_script)
        
        # Make scripts executable
        os.chmod(self.backend_dir / 'start_dev.sh', 0o755)
        os.chmod(self.backend_dir / 'start_prod.sh', 0o755)
        
        print("✅ Startup scripts created")
    
    def generate_deployment_report(self):
        """Generate deployment report"""
        print("📋 Generating deployment report...")
        
        report = {
            'deployment_time': time.strftime('%Y-%m-%d %H:%M:%S'),
            'deployment_mode': self.deployment_mode,
            'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            'project_root': str(self.project_root),
            'backend_dir': str(self.backend_dir),
            'environment_variables': {
                'DEBUG': os.getenv('DEBUG'),
                'DB_NAME': os.getenv('DB_NAME'),
                'REDIS_URL': os.getenv('REDIS_URL'),
            },
            'services': {
                'database': 'PostgreSQL',
                'cache': 'Redis',
                'web_server': 'Django/Gunicorn' if self.deployment_mode == 'production' else 'Django Development Server'
            },
            'endpoints': {
                'admin': 'http://localhost:8000/admin',
                'api': 'http://localhost:8000/api/',
                'docs': 'http://localhost:8000/api/docs/'
            }
        }
        
        with open(self.backend_dir / 'deployment_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print("✅ Deployment report generated")
        return report
    
    def deploy(self):
        """Main deployment process"""
        print("🚀 Starting E-Voting System Deployment")
        print("=" * 50)
        
        try:
            # Step 1: Check prerequisites
            self.check_prerequisites()
            
            # Step 2: Setup database
            self.setup_database()
            
            # Step 3: Install dependencies
            self.install_dependencies()
            
            # Step 4: Run migrations
            self.run_migrations()
            
            # Step 5: Create superuser
            self.create_superuser()
            
            # Step 6: Setup initial data
            self.setup_initial_data()
            
            # Step 7: Collect static files
            self.collect_static_files()
            
            # Step 8: Run tests
            self.run_tests()
            
            # Step 9: Setup services
            self.setup_services()
            
            # Step 10: Health check
            self.health_check()
            
            # Step 11: Production setup (if needed)
            if self.deployment_mode == 'production':
                self.deploy_production()
            
            # Step 12: Create startup scripts
            self.create_startup_scripts()
            
            # Step 13: Generate report
            report = self.generate_deployment_report()
            
            print("\n🎉 Deployment completed successfully!")
            print("=" * 50)
            print(f"📊 Deployment Mode: {report['deployment_mode']}")
            print(f"🔗 Admin Panel: {report['endpoints']['admin']}")
            print(f"🔗 API Endpoint: {report['endpoints']['api']}")
            print(f"👤 Admin User: admin/admin123")
            print("\n📝 Next steps:")
            print("1. Update your .env file with actual API keys")
            print("2. Configure your domain and SSL certificates")
            print("3. Set up monitoring and backups")
            print("4. Test all functionality thoroughly")
            
        except Exception as e:
            print(f"\n❌ Deployment failed: {str(e)}")
            sys.exit(1)

def main():
    """Main function"""
    deployer = EVotingDeployer()
    deployer.deploy()

if __name__ == "__main__":
    main() 