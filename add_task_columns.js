const mysql = require('mysql2/promise');

async function addTaskColumns() {
  console.log('Starting database connection...');
  
  try {
    const connection = await mysql.createConnection({
      host: '15.235.9.156',
      port: 3306,
      user: 'ville5113_ChipFlow',
      password: 'fs2H&ZFRP4_b',
      database: 'ville5113_ChipFlow'
    });

    console.log('Connected to database!');
    
    const alterQueries = [
      "ALTER TABLE tasks ADD COLUMN priority VARCHAR(20) DEFAULT 'medium'",
      "ALTER TABLE tasks ADD COLUMN status VARCHAR(20) DEFAULT 'todo'", 
      "ALTER TABLE tasks ADD COLUMN assignee VARCHAR(255) NULL",
      "ALTER TABLE tasks ADD COLUMN due_date DATE NULL",
      "ALTER TABLE tasks ADD COLUMN labels TEXT NULL",
      "ALTER TABLE tasks ADD COLUMN checklist TEXT NULL"
    ];
    
    console.log('Adding new columns to tasks table...');
    
    for (const query of alterQueries) {
      try {
        console.log(`Executing: ${query}`);
        await connection.execute(query);
        console.log('✓ Success');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('✓ Column already exists, skipping');
        } else {
          console.error(`✗ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\nVerifying table structure...');
    const [rows] = await connection.execute('DESCRIBE tasks');
    console.table(rows);

    await connection.end();
    console.log('Connection closed. All done!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addTaskColumns().catch(console.error); 