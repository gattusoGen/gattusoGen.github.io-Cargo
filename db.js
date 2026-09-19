const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'cargo.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            sku TEXT UNIQUE,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            price REAL NOT NULL,
            sale_price REAL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            image TEXT NOT NULL,
            images_json TEXT NOT NULL,
            specifications_json TEXT NOT NULL DEFAULT '{}',
            is_active INTEGER DEFAULT 1,
            availability TEXT NOT NULL DEFAULT 'IN_STOCK',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS product_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            size TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT 'Standard',
            stock_count INTEGER DEFAULT 20,
            sku TEXT UNIQUE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            city TEXT NOT NULL,
            postal_code TEXT NOT NULL,
            subtotal REAL NOT NULL,
            shipping_fee REAL NOT NULL,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT DEFAULT 'PENDING',
            fulfillment_status TEXT DEFAULT 'UNFULFILLED',
            tracking_number TEXT,
            notes TEXT,
            stock_reserved INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id TEXT NOT NULL,
            variant_id INTEGER,
            product_name TEXT NOT NULL,
            size TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT 'Standard',
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'NEW',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customer_addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            label TEXT NOT NULL DEFAULT 'Default',
            recipient_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address_line1 TEXT NOT NULL,
            address_line2 TEXT,
            city TEXT NOT NULL,
            postal_code TEXT NOT NULL,
            country_code TEXT NOT NULL DEFAULT 'ZA',
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_token TEXT UNIQUE,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cart_id INTEGER NOT NULL,
            product_id TEXT NOT NULL,
            variant_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (cart_id, variant_id),
            FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            provider TEXT NOT NULL,
            provider_payment_id TEXT,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'ZAR',
            status TEXT NOT NULL DEFAULT 'PENDING',
            raw_payload TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (provider, provider_payment_id),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS inventory_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            variant_id INTEGER NOT NULL,
            order_id INTEGER,
            movement_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            reference TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS shipping_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL DEFAULT 0,
            free_over REAL,
            is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            shipping_method_id INTEGER,
            status TEXT NOT NULL DEFAULT 'PENDING',
            tracking_number TEXT,
            shipped_at DATETIME,
            delivered_at DATETIME,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON DELETE SET NULL
        );
    `);

    try {
        db.exec('ALTER TABLE orders ADD COLUMN stock_reserved INTEGER DEFAULT 0');
    } catch (err) {
        if (!err.message.includes('duplicate column name')) throw err;
    }
    try {
        db.exec('ALTER TABLE order_items ADD COLUMN variant_id INTEGER');
    } catch (err) {
        if (!err.message.includes('duplicate column name')) throw err;
    }
    const migrations = [
        ['products', 'sku', 'TEXT'],
        ['products', 'sale_price', 'REAL'],
        ['products', 'specifications_json', "TEXT NOT NULL DEFAULT '{}'"],
        ['products', 'availability', "TEXT NOT NULL DEFAULT 'IN_STOCK'"],
        ['products', 'updated_at', 'DATETIME'],
        ['product_variants', 'color', "TEXT NOT NULL DEFAULT 'Standard'"]
        ,['order_items', 'color', "TEXT NOT NULL DEFAULT 'Standard'"]
    ];
    for (const [table, column, definition] of migrations) {
        try {
            db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        } catch (err) {
            if (!err.message.includes('duplicate column name')) throw err;
        }
    }

    seedDefaultData();
    seedCommerceFoundation();
    normalizeLegacyProducts();
    normalizeTentImages();
    normalizeProvidedProductNames();
    seedProvidedTShirts();
    removeUnregisteredProductImages();
}

function removeUnregisteredProductImages() {
    db.prepare(`
        UPDATE products
        SET image = '', images_json = '[]', updated_at = CURRENT_TIMESTAMP
        WHERE image LIKE 'http://%' OR image LIKE 'https://%'
    `).run();
}

function normalizeLegacyProducts() {
    const products = db.prepare('SELECT id, category, sku, specifications_json, availability FROM products').all();
    const update = db.prepare(`
        UPDATE products
        SET sku = COALESCE(sku, ?),
            specifications_json = CASE WHEN specifications_json IS NULL OR specifications_json = '' THEN ? ELSE specifications_json END,
            availability = CASE WHEN availability IS NULL OR availability = '' THEN ? ELSE availability END,
            updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
        WHERE id = ?
    `);
    for (const product of products) {
        update.run(`${product.id.toUpperCase()}-BASE`, JSON.stringify({ category: product.category }), product.availability || 'IN_STOCK', product.id);
    }
}

function normalizeTentImages() {
    const tentGalleries = {
        t_expedition_canvas: [
            'products/bow tent safari/Screenshot 2026-09-07 223913.png',
            'products/bow tent safari/Screenshot 2026-09-07 223927.png',
            'products/bow tent safari/Screenshot 2026-09-07 223934.png',
            'products/bow tent safari/Screenshot 2026-09-07 223946.png',
            'products/bow tent safari/Screenshot 2026-09-07 224009.png',
            'products/bow tent safari/Screenshot 2026-09-07 224018.png'
        ],
        t_recon_bivy: [
            'products/bow tent savannah 3/Screenshot 2026-09-07 222253.png',
            'products/bow tent savannah 3/Screenshot 2026-09-07 222307.png',
            'products/bow tent savannah 3/Screenshot 2026-09-07 222320.png',
            'products/bow tent savannah 3/Screenshot 2026-09-07 222335.png',
            'products/bow tent savannah 3/Screenshot 2026-09-07 222349.png',
            'products/bow tent savannah 3/Screenshot 2026-09-07 222618.png',
            'products/bow tent savannah 3/Screenshot 2026-09-07 222639.png'
        ],
        t_dome_4p: [
            'products/bow tent savannah 4/Screenshot 2026-09-07 222757.png',
            'products/bow tent savannah 4/Screenshot 2026-09-07 223035.png',
            'products/bow tent savannah 4/Screenshot 2026-09-07 223053.png',
            'products/bow tent savannah 4/Screenshot 2026-09-07 223104.png',
            'products/bow tent savannah 4/Screenshot 2026-09-07 223118.png',
            'products/bow tent savannah 4/Screenshot 2026-09-07 223125.png',
            'products/bow tent savannah 4/Screenshot 2026-09-07 223140.png',
            'products/bow tent savannah 4/Screenshot 2026-09-07 223156.png'
        ],
        t_field_cot_tent: [
            'products/bow tent savannah 5/Screenshot 2026-09-07 223518.png',
            'products/bow tent savannah 5/Screenshot 2026-09-07 223533.png',
            'products/bow tent savannah 5/Screenshot 2026-09-07 223543.png',
            'products/bow tent savannah 5/Screenshot 2026-09-07 223553.png',
            'products/bow tent savannah 5/Screenshot 2026-09-07 223746.png',
            'products/bow tent savannah 5/Screenshot 2026-09-07 223805.png',
            'products/bow tent savannah 5/Screenshot 2026-09-07 223814.png',
            'products/bow tent savannah 5/Screenshot 2026-09-07 223823.png'
        ]
    };
    const updateProduct = db.prepare(`
        UPDATE products
        SET image = ?, images_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND category = 'tents'
    `);
    for (const [productId, images] of Object.entries(tentGalleries)) {
        updateProduct.run(images[0], JSON.stringify(images), productId);
    }
}

function normalizeProvidedProductNames() {
    const names = {
        t_expedition_canvas: ['bow tent safari', 'bow-tent-safari'],
        t_recon_bivy: ['bow tent savannah 3', 'bow-tent-savannah-3'],
        t_dome_4p: ['bow tent savannah 4', 'bow-tent-savannah-4'],
        t_field_cot_tent: ['bow tent savannah 5', 'bow-tent-savannah-5']
    };
    const updateProduct = db.prepare(`
        UPDATE products
        SET name = ?, slug = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND category = 'tents'
    `);
    for (const [productId, [name, slug]] of Object.entries(names)) {
        updateProduct.run(name, slug, productId);
    }
}

function seedProvidedTShirts() {
    const products = [
        {
            id: 'shirt_green',
            sku: 'GREEN-T-SHIRT-BASE',
            name: 'Green T-Shirt',
            slug: 'green-t-shirt',
            image: 'products/Green T-shirt/Screenshot 2026-01-07 072903.png'
        },
        {
            id: 'shirt_pt',
            sku: 'PT-T-SHIRT-BASE',
            name: 'PT T-Shirt',
            slug: 'pt-t-shirt',
            image: 'products/PT T-shirt/Screenshot 2026-01-07 072936.png'
        }
    ];
    const insertProduct = db.prepare(`
        INSERT OR IGNORE INTO products
        (id, sku, name, slug, price, description, category, image, images_json, specifications_json, availability, is_active)
        VALUES (?, ?, ?, ?, 0, ?, 'shirts', ?, ?, ?, 'IN_STOCK', 1)
    `);
    const insertVariant = db.prepare(`
        INSERT OR IGNORE INTO product_variants (product_id, size, color, stock_count, sku)
        VALUES (?, ?, 'Standard', 25, ?)
    `);
    const normalizeProduct = db.prepare(`
        UPDATE products
        SET name = ?, slug = ?, image = ?, images_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    for (const product of products) {
        insertProduct.run(product.id, product.sku, product.name, product.slug, `${product.name} supplied by CARGO.`, product.image, JSON.stringify([product.image]), JSON.stringify({ category: 'shirts' }));
        normalizeProduct.run(product.name, product.slug, product.image, JSON.stringify([product.image]), product.id);
        insertVariant.run(product.id, 'Standard', `${product.sku}-STANDARD`);
    }
}

function seedCommerceFoundation() {
    const categories = [
        ['boots', 'Boots'],
        ['tents', 'Tents & Shelter'],
        ['bags', 'Bags & Packs'],
        ['shirts', 'T-Shirts']
    ];
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (slug, name) VALUES (?, ?)');
    categories.forEach(category => insertCategory.run(...category));

    const insertShipping = db.prepare(`
        INSERT OR IGNORE INTO shipping_methods (code, name, price, free_over)
        VALUES (?, ?, ?, ?)
    `);
    insertShipping.run('standard', 'Standard Courier', Number(process.env.DEFAULT_SHIPPING_FEE || 150), Number(process.env.FREE_SHIPPING_THRESHOLD || 1500));
}

function seedDefaultData() {
    // Check if products exist
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM products');
    const result = countStmt.get();

    if (result.count === 0) {
        console.log('📦 Seeding initial CARGO product catalog into SQLite database...');

        const initialProducts = [
            {
                id: "p_urban",
                name: "Tarzan Boots (Urban)",
                slug: "tarzan-boots-urban",
                price: 1700,
                description: "Light brown wax finish genuine leather boots. Reinforced ankle support engineered for urban patrol and tactical operations.",
                category: "boots",
                image: "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143622.png",
                images: [
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143622.png",
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143635.png",
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143659.png",
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143719.png"
                ],
                sizes: ["4", "5", "6", "7", "8", "9", "10", "11"]
            },
            {
                id: "p_rural",
                name: "Tarzan Boots (Rural)",
                slug: "tarzan-boots-rural",
                price: 1750,
                description: "Dark brown wax heavy-duty finish. Deep lugged rubber grip sole for rough rural terrain, bushveld, and muddy conditions.",
                category: "boots",
                image: "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143351.png",
                images: [
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143351.png",
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143437.png",
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143452.png",
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143517.png"
                ],
                sizes: ["4", "5", "6", "7", "8", "9", "10", "11"]
            },
            {
                id: "p_tactical_black",
                name: "Stealth Tactical Boots",
                slug: "stealth-tactical-boots",
                price: 1850,
                description: "Lightweight, breathable tactical boots with side-zip for rapid deployment. High-abrasion nylon with oil-resistant non-slip outsole.",
                category: "boots",
                image: "",
                images: [],
                sizes: ["4", "5", "6", "7", "8", "9", "10", "11"]
            },
            {
                id: "p_desert_recon",
                name: "Desert Recon Patrol Boots",
                slug: "desert-recon-patrol-boots",
                price: 1650,
                description: "Coyote tan suede and Cordura construction. Breathable moisture-wicking lining designed for extreme heat and sandy conditions.",
                category: "boots",
                image: "",
                images: [],
                sizes: ["4", "5", "6", "7", "8", "9", "10", "11"]
            },
            {
                id: "t_dome_4p",
                name: "4-Person Tactical Dome Tent",
                slug: "4-person-tactical-dome-tent",
                price: 2450,
                description: "Heavy-duty waterproof 3000mm ripstop canvas with thermal coating. Fast aluminum pole pitch system and mesh ventilation.",
                category: "tents",
                image: "",
                images: [],
                sizes: ["Standard"]
            },
            {
                id: "t_recon_bivy",
                name: "Recon Solo Bivy Shelter",
                slug: "recon-solo-bivy-shelter",
                price: 1200,
                description: "Ultra-compact single-operator field tent. Camouflage waterproof shell, bug mesh window, and emergency reflective heat liner.",
                category: "tents",
                image: "",
                images: [],
                sizes: ["Standard"]
            },
            {
                id: "t_expedition_canvas",
                name: "Safari Expedition 6-Person Tent",
                slug: "safari-expedition-6-person-tent",
                price: 4800,
                description: "Rugged military olive canvas tent with heavy steel frame. Designed for extended base camps and severe weather.",
                category: "tents",
                image: "",
                images: [],
                sizes: ["Standard"]
            },
            {
                id: "t_field_cot_tent",
                name: "All-Terrain Ground Camp Cot",
                slug: "all-terrain-ground-camp-cot",
                price: 1350,
                description: "Elevated folding aluminum cot. Keeps you off cold and damp ground with high-tensile 600D Oxford fabric.",
                category: "tents",
                image: "",
                images: [],
                sizes: ["Standard"]
            },
            {
                id: "b_assault_45l",
                name: "45L 3-Day MOLLE Assault Pack",
                slug: "45l-3-day-molle-assault-pack",
                price: 1450,
                description: "Standard 1000D ballistic nylon rucksack with laser-cut MOLLE webbing, hydration bladder compartment, and padded waist support.",
                category: "bags",
                image: "",
                images: [],
                sizes: ["Standard"]
            },
            {
                id: "b_duffel_80l",
                name: "80L Heavy Duty Deployment Duffel",
                slug: "80l-heavy-duty-deployment-duffel",
                price: 1100,
                description: "Waterproof tarpaulin load-out bag with reinforced carry handles and stowable backpack straps for tactical gear transport.",
                category: "bags",
                image: "",
                images: [],
                sizes: ["Standard"]
            },
            {
                id: "b_sling_pack",
                name: "Rapid Response Tactical Sling Bag",
                slug: "rapid-response-tactical-sling-bag",
                price: 650,
                description: "Ambidextrous cross-body chest pack with modular pouches and quick-release buckle.",
                category: "bags",
                image: "",
                images: [],
                sizes: ["Standard"]
            },
            {
                id: "b_hydration_vest",
                name: "3L Hydration Tactical Pack",
                slug: "3l-hydration-tactical-pack",
                price: 750,
                description: "Low-profile hydration carrier including BPA-free 3L reservoir with insulated drinking tube and thermal back padding.",
                category: "bags",
                image: "",
                images: [],
                sizes: ["Standard"]
            }
        ];

        const insertProduct = db.prepare(`
            INSERT INTO products (id, sku, name, slug, price, description, category, image, images_json, specifications_json, is_active, availability)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'IN_STOCK')
        `);

        const insertVariant = db.prepare(`
            INSERT INTO product_variants (product_id, size, color, stock_count, sku)
            VALUES (?, ?, 'Standard', ?, ?)
        `);

        initialProducts.forEach(p => {
            insertProduct.run(p.id, `${p.id.toUpperCase()}-BASE`, p.name, p.slug, p.price, p.description, p.category, p.image, JSON.stringify(p.images), JSON.stringify({ category: p.category }));
            p.sizes.forEach(size => {
                const sku = `${p.id.toUpperCase()}-${size.replace(/\s+/g, '')}`;
                insertVariant.run(p.id, size, 25, sku);
            });
        });

        console.log(`✅ Successfully seeded ${initialProducts.length} products with size variants.`);
    }

    // Check if admin user exists
    const adminCountStmt = db.prepare('SELECT COUNT(*) as count FROM admin_users');
    const adminCount = adminCountStmt.get();

    if (adminCount.count === 0) {
        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;
        const email = process.env.ADMIN_EMAIL;
        if (!username || !password || !email) {
            throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL must be configured before creating an admin user');
        }
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        const insertAdmin = db.prepare(`
            INSERT INTO admin_users (username, password_hash, email)
            VALUES (?, ?, ?)
        `);
        insertAdmin.run(username, hash, email);
        console.log(`🔐 Default admin user created: Username="${username}"`);
    }
}

// Initialize on module load
initDatabase();

module.exports = db;

