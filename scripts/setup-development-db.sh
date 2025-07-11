#!/bin/bash

# Setup Development Requests Database Schema
echo "🚀 Setting up Development Requests Database Schema..."

# Check if MySQL is accessible
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install MySQL client first."
    exit 1
fi

# Database connection variables
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"3306"}
DB_NAME=${DB_NAME:-"sdm"}
DB_USER=${DB_USER:-"root"}

# Prompt for password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo -n "Enter MySQL password for user $DB_USER: "
    read -s DB_PASSWORD
    echo
fi

# Test database connection
echo "🔌 Testing database connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database. Please check your credentials."
    exit 1
fi

echo "✅ Database connection successful!"

# Execute the schema file
echo "📊 Executing database schema..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database_schema_development_requests.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
    
    # Show created tables
    echo "📋 Created tables:"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
        SHOW TABLES LIKE '%development%' OR SHOW TABLES LIKE '%module_types%';
    "
    
    # Show master data counts
    echo "📈 Master data inserted:"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
        SELECT 'Module Types' as table_name, COUNT(*) as count FROM module_types
        UNION ALL
        SELECT 'Development Priorities', COUNT(*) FROM development_priorities
        UNION ALL
        SELECT 'Development Statuses', COUNT(*) FROM development_statuses;
    "
    
    echo "🎉 Development Requests system is ready to use!"
    echo ""
    echo "📚 Next steps:"
    echo "1. Start your Next.js application"
    echo "2. Navigate to /dashboard/development"
    echo "3. Create your first development request"
    
else
    echo "❌ Error executing database schema!"
    exit 1
fi 