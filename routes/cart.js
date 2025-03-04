const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Kiểm tra và tránh lỗi OverwriteModelError
const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    imageUrl: String
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Hiển thị giỏ hàng
router.get('/', async (req, res) => {
    const cart = req.session.cart || []; // Lấy giỏ hàng từ session
    try {
        // Truy vấn tất cả sản phẩm để hiển thị tên, giá và ảnh trong giỏ hàng
        const productIds = cart.map(item => item._id);
        const products = await Product.find({ '_id': { $in: productIds } });

        // Tạo lại giỏ hàng với đầy đủ thông tin sản phẩm
        const updatedCart = cart.map(cartItem => {
            const product = products.find(p => p._id.toString() === cartItem._id);
            return {
                ...cartItem,
                name: product ? product.name : 'Sản phẩm không tìm thấy',
                price: product ? product.price : 0,
                imageUrl: product ? product.imageUrl : ''
            };
        });

        res.render('cart', { cart: updatedCart, products }); // Render view 'cart' với thông tin đầy đủ sản phẩm
    } catch (error) {
        console.error('Lỗi khi truy vấn sản phẩm:', error);
        res.status(500).send('Lỗi hệ thống');
    }
});

// Thêm sản phẩm vào giỏ hàng (hỗ trợ số lượng)
router.post('/add', async (req, res) => {
    console.log("Dữ liệu nhận được từ form:", req.body); // Debug dữ liệu gửi lên
    const productId = req.body.productId;

    // Lấy giỏ hàng từ session (hoặc khởi tạo nếu chưa có)
    if (!req.session.cart) {
        req.session.cart = [];
    }

    try {
        const product = await Product.findById(productId); // Truy vấn từ MongoDB
        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại');
        }

        // Kiểm tra nếu sản phẩm đã có trong giỏ hàng
        const existingItem = req.session.cart.find(item => item._id.toString() === productId);
        if (existingItem) {
            existingItem.quantity += 1; // Nếu đã có, tăng số lượng
        } else {
            req.session.cart.push({ _id: product._id.toString(), name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: 1 }); // Nếu chưa có, thêm vào giỏ hàng
        }

        console.log("🛒 Giỏ hàng sau khi thêm:", req.session.cart);
        res.redirect('/cart');
    } catch (error) {
        console.error('Lỗi khi tìm sản phẩm:', error);
        res.status(500).send('Lỗi server');
    }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.post('/update-quantity', (req, res) => {
    const { productId, quantity } = req.body;

    if (req.session.cart) {
        const cartItem = req.session.cart.find(item => item._id === productId);
        if (cartItem) {
            cartItem.quantity = parseInt(quantity, 10); // Cập nhật số lượng sản phẩm
        }
    }

    console.log("🛒 Giỏ hàng sau khi cập nhật số lượng:", req.session.cart);
    res.redirect('/cart');
});

// Xóa sản phẩm khỏi giỏ hàng (giảm số lượng hoặc xóa hẳn)
router.post('/remove', (req, res) => {
    const productId = req.body.productId;

    if (req.session.cart) {
        req.session.cart = req.session.cart.map(item => {
            if (item._id === productId) {
                item.quantity -= 1; // Giảm số lượng sản phẩm
            }
            return item;
        }).filter(item => item.quantity > 0); // Xóa sản phẩm nếu số lượng về 0
    }

    console.log("🛒 Giỏ hàng sau khi xóa:", req.session.cart);
    res.redirect('/cart');
});

// Xóa toàn bộ sản phẩm khỏi giỏ hàng
router.post('/clear', (req, res) => {
    req.session.cart = []; // Xóa toàn bộ giỏ hàng
    res.redirect('/cart');
});

module.exports = router;
