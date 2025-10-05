import mongoose from 'mongoose';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Test from './modals/Test.js';
import dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_FILE_PATH = path.join(__dirname, 'data', 'medical_tests.csv');


// --- Helper Functions to Generate Mock Data ---

// Generates a unique test code from the test name
const generateTestCode = (testName, index) => {
    const prefix = testName.split(' ')[0].substring(0, 4).toUpperCase();
    return `${prefix}${String(index + 1).padStart(3, '0')}`;
};

// Maps CSV category to schema enum values (FIXED)
const mapCategory = (csvCategory) => {
    const mapping = {
        "Blood Tests": "Blood Test",
        "Urine & Stool Tests": "Urine Test",
        "Infection & Immunology Tests": "Infection",
        "Special Tests": "Special", // This is valid in your enum
        "Imaging & Radiology": "Imaging",
        "Other Tests": "Other"
    };
    return mapping[csvCategory] || 'Other';
};

// Generates a plausible sample type based on category (FIXED)
const getSampleType = (category) => {
    switch (category) {
        case 'Blood Test':
        case 'Infection':
        case 'Special':
             return 'Blood';
        case 'Urine Test':
            return 'Urine';
        case 'Imaging':
            return 'Other'; // Changed from 'Not Applicable' to 'Other'
        default:
            return 'Other';
    }
};

// Generates random but realistic costs
const generateCost = (category) => {
    if (category === 'Imaging') {
        return Math.floor(Math.random() * (8000 - 1500 + 1)) + 1500; // 1500 - 8000
    }
    return Math.floor(Math.random() * (2500 - 300 + 1)) + 300; // 300 - 2500
};

// Generates reporting time
const getReportingTime = (category) => {
    const times = ["Same day", "24 hours", "48 hours", "3-5 days"];
    if (category === 'Imaging') {
        return "Same day";
    }
    return times[Math.floor(Math.random() * times.length)];
}

// Generates test preparation instructions
const getPreparation = (testName) => {
    const name = testName.toLowerCase();
    if (name.includes('fasting') || name.includes('lipid')) {
        return {
            fasting: true,
            fastingHours: 12,
            instructions: ["Fasting for 10-12 hours is required.", "Water is permitted."]
        }
    }
    return {
        fasting: false,
        instructions: ["No special preparation required."]
    }
}


// --- Main Seeding Function ---
const seedDatabase = async () => {
    try {
        // 1. Connect to MongoDB (FIXED - removed deprecated options)
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully.');

        // 2. Clear existing data
        await Test.deleteMany({});
        console.log('Previous data in "Test" collection cleared.');

        // 3. Read and process CSV data
        const tests = [];
        
        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csv())
            .on('data', (row) => {
                const mappedCategory = mapCategory(row.Category);
                const testData = {
                    testName: row['Test Name'],
                    category: mappedCategory,
                    testCode: generateTestCode(row['Test Name'], tests.length),
                    description: `This test measures ${row['Test Name']} to evaluate health.`,
                    sampleType: getSampleType(mappedCategory),
                    cost: generateCost(mappedCategory),
                    reportingTime: getReportingTime(mappedCategory),
                    preparation: getPreparation(row['Test Name']),
                    labId: `L-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    normalRange: { textRange: "Varies by age, gender, and medical history." },
                    isActive: true,
                };
                tests.push(testData);
            })
            .on('end', async () => {
                try {
                    // 4. Insert processed data into the database
                    console.log(`About to insert ${tests.length} tests...`);
                    
                    // Log first test for debugging
                    console.log('Sample test data:', JSON.stringify(tests[0], null, 2));
                    
                    await Test.insertMany(tests);
                    console.log(`${tests.length} tests have been successfully seeded!`);
                } catch (insertError) {
                    console.error('Error inserting data:', insertError);
                    
                    // Try inserting one by one to identify problematic records
                    console.log('Attempting individual inserts to identify issues...');
                    for (let i = 0; i < tests.length; i++) {
                        try {
                            await Test.create(tests[i]);
                            console.log(`✓ Inserted test ${i + 1}: ${tests[i].testName}`);
                        } catch (singleError) {
                            console.error(`✗ Error with test ${i + 1} (${tests[i].testName}):`, singleError.message);
                            console.error('Test data:', JSON.stringify(tests[i], null, 2));
                        }
                    }
                } finally {
                    // 5. Close the database connection
                    await mongoose.connection.close();
                    console.log('MongoDB connection closed.');
                }
            })
            .on('error', (error) => {
                console.error('Error reading CSV file:', error);
                mongoose.connection.close();
            });

    } catch (error) {
        console.error('Could not connect to MongoDB:', error);
        process.exit(1);
    }
};

// --- Execute the seeder ---
seedDatabase();
