// MongoDB initialization script
print('Starting MongoDB initialization...');

// Initialize replica set (required for transactions)
try {
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "localhost:27017" }
    ]
  });
  print('Replica set initialized');
} catch (e) {
  print('Replica set already initialized or error:', e.message);
}

// Create database and collection
db = db.getSiblingDB('devopsTp2');
print('Using database:', db.getName());

// Create users collection with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

print('✅ MongoDB initialization completed successfully');
