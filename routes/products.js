const express = require('express');
const Product = require('../models/product'); // Đảm bảo mô hình sản phẩm đã được định nghĩa
const router = express.Router();

// Route để lấy danh sách sản phẩm
router.get('/', async (req, res) => {
    try {
        const products = await Product.find(); // Lấy tất cả sản phẩm từ cơ sở dữ liệu
        if (!products.length) {
            return res.status(404).json({ message: 'Không có sản phẩm nào.' });
        }
        res.render('product', { products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm.' });
    }
});

// Route để xem thông tin chi tiết sản phẩm
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        res.render('productDetail', { product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin sản phẩm.' });
    }
});

// Route để tạo sản phẩm
router.post('/', async (req, res) => {
    try {
        const { name, price, description, imageUrl } = req.body;
        console.log("Dữ liệu sản phẩm nhận được:", req.body); // Log dữ liệu nhận được
        
        // Kiểm tra xem các trường bắt buộc có được cung cấp hay không
        if (!name || !price || !description || !imageUrl) {
            return res.status(400).json({ message: 'Các trường name, price, description và imageUrl là bắt buộc.' });
        }

        const newProduct = new Product({ name, price, description, imageUrl });
        await newProduct.save();
        res.status(201).json(newProduct); // Trả về sản phẩm vừa tạo
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi tạo sản phẩm.' });
    }
});

// Route để sửa sản phẩm
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        res.json(product); // Trả về sản phẩm đã sửa
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi sửa sản phẩm.' });
    }
});

// Route để xóa sản phẩm
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        res.sendStatus(204); // Trả về trạng thái 204 khi xóa thành công
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi xóa sản phẩm.' });
    }
});

// Route để thêm sản phẩm vào giỏ hàng
router.post('/add-to-cart', (req, res) => {
    const productId = req.body.productId;

    // Khởi tạo giỏ hàng nếu chưa tồn tại
    if (!req.session.cart) {
        req.session.cart = [];
    }

    // Thêm sản phẩm vào giỏ hàng
    req.session.cart.push(productId);
    console.log("Giỏ hàng hiện tại:", req.session.cart); // Log giỏ hàng

    // Chuyển hướng về danh sách sản phẩm
    res.redirect('/products');
});

// Route để xem giỏ hàng
router.get('/cart', async (req, res) => {
    const cart = req.session.cart || [];
    console.log("Giỏ hàng:", cart); // Log giỏ hàng

    // Tìm thông tin sản phẩm từ cart
    const cartItems = await Promise.all(cart.map(async (itemId) => {
        return await Product.findById(itemId); // Lấy thông tin sản phẩm từ cơ sở dữ liệu
    }));

    res.render('cart', { cart: cartItems }); // Render view cho giỏ hàng
});

module.exports = router;