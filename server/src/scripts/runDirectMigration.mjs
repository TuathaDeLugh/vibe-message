    // Read the SQL file
    const sqlPath = path.join(__dirname, "../../sql/add_public_key_direct.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    const result = await client.query(sql);

    console.log("✅ Migration executed successfully!\n");

    // Show the results
    if (result && Array.isArray(result)) {
      const lastResult = result[result.length - 1];
      if (lastResult.rows && lastResult.rows.length > 0) {
        console.log("📋 Current apps table structure:");
        console.table(lastResult.rows);
      }
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runDirectMigration()
  .then(() => {
    console.log("\n✨ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Error:", error.message);
    process.exit(1);
  });
