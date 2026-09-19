const inventory = [
    {
        id: "boots",
        name: "Boots",
        icon: "fa-shoe-prints",
        products: [
            {
                id: "p_urban",
                name: "Tarzan Boots (Urban)",
                price: 1700,
                description: "Light brown wax finish genuine leather boots. Reinforced ankle support engineered for urban patrol and tactical operations.",
                image: "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143622.png",
                images: [
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143622.png",
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143635.png",
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143659.png",
                    "products/Light brown wax tarzan(urban)/Screenshot 2026-01-06 143719.png"
                ]
            },
            {
                id: "p_rural",
                name: "Tarzan Boots (Rural)",
                price: 1750,
                description: "Dark brown wax heavy-duty finish. Deep lugged rubber grip sole for rough rural terrain, bushveld, and muddy conditions.",
                image: "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143351.png",
                images: [
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143351.png",
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143437.png",
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143452.png",
                    "products/Dark brown wax Tarzan (rural)/Screenshot 2026-01-06 143517.png"
                ]
            },
            {
                id: "p_tactical_black",
                name: "Stealth Tactical Boots",
                price: 1850,
                description: "Lightweight, breathable tactical boots with side-zip for rapid deployment. High-abrasion nylon with oil-resistant non-slip outsole.",
                image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
                ]
            },
            {
                id: "p_desert_recon",
                name: "Desert Recon Patrol Boots",
                price: 1650,
                description: "Coyote tan suede and Cordura construction. Breathable moisture-wicking lining designed for extreme heat and sandy conditions.",
                image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80"
                ]
            }
        ]
    },
    {
        id: "tents",
        name: "Tents & Shelter",
        icon: "fa-campground",
        products: [
            {
                id: "t_dome_4p",
                name: "4-Person Tactical Dome Tent",
                price: 2450,
                description: "Heavy-duty waterproof 3000mm ripstop canvas with thermal coating. Fast aluminum pole pitch system and mesh ventilation.",
                image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80"
                ]
            },
            {
                id: "t_recon_bivy",
                name: "Recon Solo Bivy Shelter",
                price: 1200,
                description: "Ultra-compact single-operator field tent. Camouflage waterproof shell, bug mesh window, and emergency reflective heat liner.",
                image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=600&q=80"
                ]
            },
            {
                id: "t_expedition_canvas",
                name: "Safari Expedition 6-Person Tent",
                price: 4800,
                description: "Rugged military olive canvas tent with heavy steel frame. Designed for extended base camps and severe weather.",
                image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?auto=format&fit=crop&w=600&q=80"
                ]
            },
            {
                id: "t_field_cot_tent",
                name: "All-Terrain Ground Camp Cot",
                price: 1350,
                description: "Elevated folding aluminum cot. Keeps you off cold and damp ground with high-tensile 600D Oxford fabric.",
                image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80"
                ]
            }
        ]
    },
    {
        id: "bags",
        name: "Bags & Packs",
        icon: "fa-hiking",
        products: [
            {
                id: "b_assault_45l",
                name: "45L 3-Day MOLLE Assault Pack",
                price: 1450,
                description: "Standard 1000D ballistic nylon rucksack with laser-cut MOLLE webbing, hydration bladder compartment, and padded waist support.",
                image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"
                ]
            },
            {
                id: "b_duffel_80l",
                name: "80L Heavy Duty Deployment Duffel",
                price: 1100,
                description: "Waterproof tarpaulin load-out bag with reinforced carry handles and stowable backpack straps for tactical gear transport.",
                image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=600&q=80"
                ]
            },
            {
                id: "b_sling_pack",
                name: "Rapid Response Tactical Sling Bag",
                price: 650,
                description: "Ambidextrous cross-body chest pack with modular pouches and quick-release buckle.",
                image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80"
                ]
            },
            {
                id: "b_hydration_vest",
                name: "3L Hydration Tactical Pack",
                price: 750,
                description: "Low-profile hydration carrier including BPA-free 3L reservoir with insulated drinking tube and thermal back padding.",
                image: "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80",
                images: [
                    "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80"
                ]
            }
        ]
    }
];
