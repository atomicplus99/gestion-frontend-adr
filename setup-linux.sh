#!/bin/bash

# Script automático para Linux - Instala Nginx y despliega la aplicación
# Uso: sudo bash setup-linux.sh

echo "🚀 Configuración automática para Linux..."

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script debe ejecutarse como root (sudo)"
    echo "💡 Ejecuta: sudo bash setup-linux.sh"
    exit 1
fi

# Detectar distribución
if command -v apt &> /dev/null; then
    DISTRO="debian"
    echo "📦 Distribución detectada: Ubuntu/Debian"
elif command -v dnf &> /dev/null; then
    DISTRO="rhel"
    echo "📦 Distribución detectada: CentOS/RHEL/Fedora"
elif command -v yum &> /dev/null; then
    DISTRO="rhel"
    echo "📦 Distribución detectada: CentOS/RHEL"
else
    echo "❌ Distribución no soportada"
    exit 1
fi

# Paso 1: Actualizar IP del backend
echo "📡 Paso 1: Actualizando IP del backend..."
powershell -ExecutionPolicy Bypass -File update-ip.ps1

# Paso 2: Construir la aplicación
echo "🔨 Paso 2: Construyendo aplicación Angular..."
npm run build

# Paso 3: Instalar Nginx
echo "📥 Paso 3: Instalando Nginx..."

if [ "$DISTRO" = "debian" ]; then
    apt update
    apt install -y nginx
elif [ "$DISTRO" = "rhel" ]; then
    if command -v dnf &> /dev/null; then
        dnf install -y epel-release
        dnf install -y nginx
    else
        yum install -y epel-release
        yum install -y nginx
    fi
fi

# Paso 4: Configurar Nginx
echo "⚙️ Paso 4: Configurando Nginx..."

# Crear directorio para la aplicación
mkdir -p /var/www/gestion-academica

# Crear configuración de Nginx
cat > /etc/nginx/sites-available/gestion-academica << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        root /var/www/gestion-academica/dist/gestion-academico-andresdr/browser;
        try_files $uri $uri/ /index.html;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    location /auth/ {
        proxy_pass https://192.168.1.108:30001/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/gestion-academica/dist/gestion-academico-andresdr/browser;
        expires 1y;
    }
    
    error_page 404 /index.html;
}
EOF

# Activar el sitio
ln -sf /etc/nginx/sites-available/gestion-academica /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Paso 5: Copiar archivos de la aplicación
echo "📋 Paso 5: Copiando archivos de la aplicación..."
cp -r dist/* /var/www/gestion-academica/

# Establecer permisos
chown -R www-data:www-data /var/www/gestion-academica
chmod -R 755 /var/www/gestion-academica

# Paso 6: Configurar firewall
echo "🔥 Paso 6: Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# Paso 7: Probar configuración
echo "🧪 Paso 7: Probando configuración..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración válida"
    
    # Paso 8: Iniciar Nginx
    echo "🚀 Paso 8: Iniciando Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    echo ""
    echo "🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!"
    echo ""
    echo "🌐 Tu aplicación está disponible en:"
    echo "  http://localhost"
    echo "  http://$(hostname -I | awk '{print $1}')"
    echo ""
    echo "📋 Comandos disponibles:"
    echo "  sudo systemctl start nginx     - Iniciar Nginx"
    echo "  sudo systemctl stop nginx      - Detener Nginx"
    echo "  sudo systemctl restart nginx   - Reiniciar Nginx"
    echo "  sudo systemctl status nginx    - Estado de Nginx"
    echo ""
    echo "🚀 Nginx se inició automáticamente"
    
else
    echo "❌ Error en la configuración de Nginx"
    exit 1
fi
