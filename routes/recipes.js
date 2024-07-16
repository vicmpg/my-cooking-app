const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();

// AWS S3 Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

// Multer Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// In-memory recipes database
let recipes = [
    {
        id: 1,
        name: "Spaghetti Bolognese",
        description: "A classic Italian pasta dish.",
        image: null,
        ingredients: ["200g spaghetti", "100g minced beef", "1 can tomato sauce", "1 onion", "2 cloves garlic", "Salt", "Pepper"],
        steps: ["Boil the spaghetti according to the package instructions.", "Cook the minced beef in a pan until browned.", "Add chopped onion and garlic, and cook until softened.", "Add tomato sauce, salt, and pepper, and simmer for 20 minutes.", "Serve the sauce over the spaghetti."]
    },
    // Add more recipes similarly
];

// Route to upload image
router.post('/upload/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const recipe = recipes.find(r => r.id == id);

    if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}_${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read'
    };

    try {
        const data = await s3.send(new PutObjectCommand(params));
        recipe.image = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        res.json({ message: 'Image uploaded successfully', imageUrl: recipe.image });
    } catch (err) {
        res.status(500).json({ error: 'Error uploading file' });
    }
});

// Route to list recipes
router.get('/', (req, res) => {
    res.json(recipes);
});

// Route to retrieve a specific recipe
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const recipe = recipes.find(r => r.id == id);

    if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json(recipe);
});

module.exports = router;
