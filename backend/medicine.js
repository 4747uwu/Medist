import mongoose from 'mongoose';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Medicine from './modals/Medicine.js';
import dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_FILE_PATH = path.join(__dirname, 'data', 'test.productsname.csv');

// --- Helper Functions to Generate Mock Data ---

const forms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment', 'Gel', 'Powder'];
const categories = ['Analgesic', 'Antibiotic', 'Antiviral', 'Antifungal', 'Anti-inflammatory', 'Antacid', 'Antihistamine', 'Cardiovascular', 'Diabetes', 'Respiratory', 'Vitamin', 'Supplement', 'Other'];
const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'As needed'];
const timings = ['Before meals', 'After meals', 'With meals'];

// Generates form and strength based on medicine name or randomly
const getFormAndStrength = (name) => {
    const upperName = name.toUpperCase();
    let form = forms[Math.floor(Math.random() * forms.length)];
    let strength = {};

    if (upperName.includes('SYRUP')) form = 'Syrup';
    else if (upperName.includes('TABLET') || upperName.includes(' DT')) form = 'Tablet';
    else if (upperName.includes('INJECTION')) form = 'Injection';
    else if (upperName.includes('GEL')) form = 'Gel';
    else if (upperName.includes('CREAM')) form = 'Cream';
    else if (upperName.includes('POWDER')) form = 'Powder';
    else if (upperName.includes('DROPS')) form = 'Drops';

    switch (form) {
        case 'Tablet':
        case 'Capsule':
            strength = { value: [10, 50, 100, 250, 500, 650][Math.floor(Math.random() * 6)], unit: 'mg' };
            break;
        case 'Syrup':
        case 'Drops':
            strength = { value: [60, 100, 150, 200][Math.floor(Math.random() * 4)], unit: 'ml' };
            break;
        case 'Injection':
            strength = { value: [1, 2, 5, 10][Math.floor(Math.random() * 4)], unit: 'ml' };
            break;
        case 'Cream':
        case 'Gel':
        case 'Ointment':
            strength = { value: [1, 2, 5, 10][Math.floor(Math.random() * 4)], unit: '%' };
            break;
        case 'Powder':
             strength = { value: [50, 100, 200][Math.floor(Math.random() * 3)], unit: 'g' };
             break;
        default:
             strength = { value: 1, unit: 'units' };
    }
    return { form, strength };
};

// Generates random cost
const generateCost = () => {
    const mrp = parseFloat((Math.random() * (1500 - 50) + 50).toFixed(2));
    const sellingPrice = parseFloat((mrp * (Math.random() * (0.95 - 0.8) + 0.8)).toFixed(2)); // 80-95% of MRP
    return { mrp, sellingPrice };
};

// --- Main Seeding Function ---
const seedMedicines = async () => {
    try {
        // 1. Connect to MongoDB (FIXED - removed deprecated options)
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected for seeding medicines.');

        // 2. Clear existing data
        await Medicine.deleteMany({});
        console.log('Previous medicine data cleared.');

        // 3. Read and process CSV data
        const medicines = [];
        const uniqueEntries = new Set();

        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csv())
            .on('data', (row) => {
                // Prevent duplicates from the CSV file
                const uniqueKey = `${row.name}-${row.companyName}`.toLowerCase();
                if (row.name && row.companyName && !uniqueEntries.has(uniqueKey)) {
                    uniqueEntries.add(uniqueKey);

                    const { form, strength } = getFormAndStrength(row.name);
                    const cost = generateCost();
                    
                    // Generate unique medicineCode for each medicine
                    const medicineCode = `MED${String(medicines.length + 1).padStart(4, '0')}`;

                    const medicineData = {
                        medicineCode, // Set the code explicitly to avoid auto-generation conflicts
                        name: row.name.trim(),
                        companyName: row.companyName.trim(),
                        labId: 'DEFAULT', // Use a default lab ID
                        genericName: row.name.split(' ')[0], // Simple generic name
                        brandName: row.name.trim(),
                        category: categories[Math.floor(Math.random() * categories.length)],
                        form: form,
                        strength: strength,
                        composition: [{
                            ingredient: row.name.split(' ')[0],
                            quantity: `${strength.value}${strength.unit}`
                        }],
                        indications: ['As prescribed by the physician.'],
                        contraindications: ['Consult your doctor for contraindications.'],
                        sideEffects: ['May include nausea, headache, or dizziness. Varies by patient.'],
                        dosageInstructions: {
                            adultDose: '1-2 units, as directed by a healthcare professional.',
                            childDose: 'Consult a pediatrician.',
                            elderlyDose: 'Consult a doctor for dose adjustment.',
                            frequency: [frequencies[Math.floor(Math.random() * frequencies.length)]],
                            timing: [timings[Math.floor(Math.random() * timings.length)]]
                        },
                        storage: {
                            temperature: 'Store below 25°C.',
                            conditions: 'Keep in a cool, dry place, away from direct sunlight.',
                            shelfLife: '24 months'
                        },
                        cost: cost,
                        prescription: {
                            required: Math.random() > 0.3, // 70% chance of requiring a prescription
                            schedule: ['H', 'H1', 'G'][Math.floor(Math.random() * 3)]
                        },
                        isActive: true
                    };
                    medicines.push(medicineData);
                }
            })
            .on('end', async () => {
                try {
                    console.log(`About to insert ${medicines.length} medicines...`);
                    
                    // Use insertMany instead of create to avoid pre-save hooks that might cause conflicts
                    await Medicine.insertMany(medicines, { ordered: false });
                    console.log(`${medicines.length} unique medicines have been successfully seeded!`);
                } catch (insertError) {
                    console.error('Error inserting data:', insertError);
                    
                    // Try inserting one by one to identify problematic records
                    console.log('Attempting individual inserts to identify issues...');
                    let successful = 0;
                    for (let i = 0; i < medicines.length; i++) {
                        try {
                            await Medicine.create(medicines[i]);
                            successful++;
                            if (successful % 100 === 0) {
                                console.log(`✓ Inserted ${successful} medicines so far...`);
                            }
                        } catch (singleError) {
                            console.error(`✗ Error with medicine ${i + 1} (${medicines[i].name}):`, singleError.message);
                        }
                    }
                    console.log(`✓ Successfully inserted ${successful} out of ${medicines.length} medicines`);
                } finally {
                    // 4. Close the database connection
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
seedMedicines();