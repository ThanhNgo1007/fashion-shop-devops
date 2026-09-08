const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

// ── Models ───────────────────────────────────
const User = require("../models/UserModel");
const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");
const Role = require("../models/RoleModel");
const { Policy } = require("../models/PolicyModel");
const { sanitizePolicyContent } = require("../services/PolicyService");

// ── Config ───────────────────────────────────
const ADMIN_PASSWORD = "Admin@123";
const CUSTOMER_PASSWORD = "User@123";

// ── Data ─────────────────────────────────────

const ROLES = [
  {
    name: "Quản lý toàn quyền",
    description: "Toàn quyền quản trị hệ thống",
    permissions: [
      "manage_products",
      "manage_categories",
      "manage_orders",
      "manage_users",
      "manage_system",
    ],
  },
  {
    name: "Quản lý sản phẩm",
    description: "Quản lý sản phẩm và danh mục",
    permissions: ["manage_products", "manage_categories"],
  },
  {
    name: "Quản lý đơn hàng",
    description: "Quản lý đơn hàng",
    permissions: ["manage_orders"],
  },
];

const CATEGORIES = [
  { name: "Áo thun", description: "Áo thun nam nữ các loại" },
  { name: "Áo sơ mi", description: "Áo sơ mi công sở và casual" },
  { name: "Quần jean", description: "Quần jean nam nữ thời trang" },
  { name: "Quần tây", description: "Quần tây công sở nam nữ" },
  { name: "Váy đầm", description: "Váy đầm nữ thời trang" },
  { name: "Áo khoác", description: "Áo khoác, hoodie, jacket" },
  { name: "Phụ kiện", description: "Mũ, thắt lưng, tất, túi xách" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

// Placeholder images (picsum.photos — free, no auth)
const productImage = (id) => `https://picsum.photos/seed/fashion${id}/400/500`;

const PRODUCTS = [
  // Áo thun
  {
    name: "Áo thun basic cotton trắng",
    categoryIndex: 0,
    price: 199000,
    discount: 10,
    description: "Áo thun basic 100% cotton, form regular fit, phù hợp mọi phong cách.",
    isNewProduct: true,
    imageId: 1,
  },
  {
    name: "Áo thun oversize in hình",
    categoryIndex: 0,
    price: 259000,
    discount: 0,
    description: "Áo thun oversize chất liệu cotton pha, in hình trendy.",
    isNewProduct: true,
    imageId: 2,
  },
  {
    name: "Áo thun polo nam classic",
    categoryIndex: 0,
    price: 349000,
    discount: 15,
    description: "Áo polo chất liệu pique cotton, cổ bẻ lịch sự.",
    isNewProduct: false,
    imageId: 3,
  },
  {
    name: "Áo thun nữ crop top",
    categoryIndex: 0,
    price: 179000,
    discount: 0,
    description: "Áo thun crop top nữ, chất liệu cotton co giãn.",
    isNewProduct: true,
    imageId: 4,
  },
  // Áo sơ mi
  {
    name: "Áo sơ mi trắng công sở nam",
    categoryIndex: 1,
    price: 399000,
    discount: 20,
    description: "Áo sơ mi trắng slim fit, chất liệu cotton blend không nhăn.",
    isNewProduct: false,
    imageId: 5,
  },
  {
    name: "Áo sơ mi kẻ caro nữ",
    categoryIndex: 1,
    price: 359000,
    discount: 0,
    description: "Áo sơ mi kẻ caro phong cách casual, vải flannel mềm mại.",
    isNewProduct: true,
    imageId: 6,
  },
  {
    name: "Áo sơ mi linen nam",
    categoryIndex: 1,
    price: 459000,
    discount: 10,
    description: "Áo sơ mi linen thoáng mát, phù hợp mùa hè.",
    isNewProduct: false,
    imageId: 7,
  },
  // Quần jean
  {
    name: "Quần jean slim fit nam xanh đậm",
    categoryIndex: 2,
    price: 499000,
    discount: 25,
    description: "Quần jean slim fit co giãn, wash xanh đậm cổ điển.",
    isNewProduct: false,
    imageId: 8,
  },
  {
    name: "Quần jean baggy nữ",
    categoryIndex: 2,
    price: 449000,
    discount: 0,
    description: "Quần jean baggy form rộng thoải mái, cạp cao tôn dáng.",
    isNewProduct: true,
    imageId: 9,
  },
  {
    name: "Quần jean skinny đen",
    categoryIndex: 2,
    price: 469000,
    discount: 15,
    description: "Quần jean skinny co giãn 4 chiều, màu đen basic.",
    isNewProduct: false,
    imageId: 10,
  },
  // Quần tây
  {
    name: "Quần tây slim công sở nam",
    categoryIndex: 3,
    price: 429000,
    discount: 10,
    description: "Quần tây slim fit, chất liệu polyester blend, không nhăn.",
    isNewProduct: false,
    imageId: 11,
  },
  {
    name: "Quần tây ống rộng nữ",
    categoryIndex: 3,
    price: 389000,
    discount: 0,
    description: "Quần tây ống rộng nữ, cạp cao thanh lịch.",
    isNewProduct: true,
    imageId: 12,
  },
  // Váy đầm
  {
    name: "Váy midi hoa nhí",
    categoryIndex: 4,
    price: 529000,
    discount: 20,
    description: "Váy midi họa tiết hoa nhí vintage, chất liệu voan nhẹ.",
    isNewProduct: true,
    imageId: 13,
  },
  {
    name: "Đầm suông công sở",
    categoryIndex: 4,
    price: 599000,
    discount: 0,
    description: "Đầm suông thanh lịch, phù hợp môi trường công sở.",
    isNewProduct: false,
    imageId: 14,
  },
  {
    name: "Váy tennis xếp ly",
    categoryIndex: 4,
    price: 299000,
    discount: 30,
    description: "Váy tennis xếp ly năng động, chất liệu thun dày dặn.",
    isNewProduct: true,
    imageId: 15,
  },
  // Áo khoác
  {
    name: "Áo hoodie unisex basic",
    categoryIndex: 5,
    price: 399000,
    discount: 0,
    description: "Hoodie unisex nỉ bông dày, có mũ và túi kangaroo.",
    isNewProduct: true,
    imageId: 16,
  },
  {
    name: "Áo khoác bomber nam",
    categoryIndex: 5,
    price: 699000,
    discount: 15,
    description: "Áo khoác bomber phong cách streetwear, lót bông ấm áp.",
    isNewProduct: false,
    imageId: 17,
  },
  {
    name: "Áo khoác blazer nữ",
    categoryIndex: 5,
    price: 799000,
    discount: 10,
    description: "Blazer nữ công sở, form ôm nhẹ, hai nút cài.",
    isNewProduct: false,
    imageId: 18,
  },
  // Phụ kiện
  {
    name: "Mũ lưỡi trai unisex",
    categoryIndex: 6,
    price: 149000,
    discount: 0,
    description: "Mũ lưỡi trai cotton, điều chỉnh kích thước bằng khóa kim loại.",
    isNewProduct: false,
    imageId: 19,
  },
  {
    name: "Thắt lưng da bò nam",
    categoryIndex: 6,
    price: 299000,
    discount: 20,
    description: "Thắt lưng da bò thật, khóa tự động sang trọng.",
    isNewProduct: true,
    imageId: 20,
  },
];

const POLICIES = [
  {
    title: "Chính sách giao hàng",
    type: "shipping",
    slug: "shipping-policy",
    content: `<h2>Phạm vi giao hàng</h2><p>D.E Fashion hỗ trợ giao hàng trên toàn quốc.</p><h2>Phí vận chuyển</h2><ul><li>Tiêu chuẩn: 30.000đ (3–5 ngày)</li><li>Nhanh: 60.000đ (1–2 ngày)</li></ul>`,
  },
  {
    title: "Chính sách đổi trả",
    type: "return",
    slug: "return-policy",
    content: `<h2>Điều kiện đổi trả</h2><ul><li>Đổi trả trong 7 ngày nếu sản phẩm lỗi.</li><li>Đổi size miễn phí trong 3 ngày.</li><li>Sản phẩm chưa qua sử dụng, còn nguyên tem mác.</li></ul>`,
  },
  {
    title: "Chính sách thanh toán",
    type: "payment",
    slug: "payment-policy",
    content: `<h2>Phương thức thanh toán</h2><ul><li>COD — Thanh toán khi nhận hàng</li><li>VNPay — Thanh toán trực tuyến</li></ul>`,
  },
  {
    title: "Chính sách bảo mật",
    type: "privacy",
    slug: "privacy-policy",
    content: `<h2>Bảo mật thông tin</h2><p>D.E Fashion cam kết bảo mật thông tin cá nhân của khách hàng theo quy định pháp luật.</p>`,
  },
  {
    title: "Điều khoản sử dụng",
    type: "terms",
    slug: "terms-and-conditions",
    content: `<h2>Điều khoản</h2><p>Khi sử dụng website, khách hàng đồng ý tuân thủ các điều khoản và chính sách được công bố.</p>`,
  },
];

// ── Seed Logic ────────────────────────────────
async function seed() {
  const mongoUri =
    process.env.MONGO_URI ||
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/?retryWrites=true&w=majority`;

  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB\n");

  try {
    // 1. Roles
    console.log("── Seeding Roles ──");
    const roles = [];
    for (const roleData of ROLES) {
      const existing = await Role.findOne({ name: roleData.name });
      if (existing) {
        roles.push(existing);
        console.log(`  ✓ Role "${roleData.name}" already exists`);
      } else {
        const role = await Role.create(roleData);
        roles.push(role);
        console.log(`  + Created role "${roleData.name}"`);
      }
    }

    // 2. Admin user
    console.log("\n── Seeding Users ──");
    const hashedAdminPass = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const hashedCustomerPass = await bcrypt.hash(CUSTOMER_PASSWORD, 10);

    let admin = await User.findOne({ email: "admin@defashion.com" });
    if (!admin) {
      admin = await User.create({
        username: "Admin D.E Fashion",
        email: "admin@defashion.com",
        password: hashedAdminPass,
        isAdmin: true,
        role: roles[0]._id,
        phone: "0901234567",
        gender: "Nam",
        address: {
          province: "Thành phố Cần Thơ",
          district: "Quận Ninh Kiều",
          ward: "Phường Xuân Khánh",
          detailAddress: "Đường 3/2, Khu II",
        },
      });
      console.log(`  + Created admin: admin@defashion.com / ${ADMIN_PASSWORD}`);
    } else {
      console.log("  ✓ Admin already exists");
    }

    // Customer users
    const customers = [
      { username: "Nguyễn Văn A", email: "customer1@example.com", phone: "0912345678", gender: "Nam" },
      { username: "Trần Thị B", email: "customer2@example.com", phone: "0923456789", gender: "Nữ" },
      { username: "Lê Văn C", email: "customer3@example.com", phone: "0934567890", gender: "Nam" },
    ];

    const customerIds = [];
    for (const c of customers) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        user = await User.create({
          ...c,
          password: hashedCustomerPass,
          isAdmin: false,
          address: {
            province: "Thành phố Hồ Chí Minh",
            district: "Quận 1",
            ward: "Phường Bến Nghé",
            detailAddress: "123 Nguyễn Huệ",
          },
        });
        console.log(`  + Created customer: ${c.email} / ${CUSTOMER_PASSWORD}`);
      } else {
        console.log(`  ✓ Customer "${c.email}" already exists`);
      }
      customerIds.push(user._id);
    }

    // 3. Categories
    console.log("\n── Seeding Categories ──");
    const categoryDocs = [];
    for (const cat of CATEGORIES) {
      let existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        existing = await Category.create(cat);
        console.log(`  + Created category "${cat.name}"`);
      } else {
        console.log(`  ✓ Category "${cat.name}" already exists`);
      }
      categoryDocs.push(existing);
    }

    // 4. Products
    console.log("\n── Seeding Products ──");
    let productCount = 0;
    for (const p of PRODUCTS) {
      const existing = await Product.findOne({ name: p.name });
      if (existing) {
        console.log(`  ✓ Product "${p.name}" already exists`);
        continue;
      }

      const sizes = SIZES.map((s) => ({
        size: s,
        quantity: Math.floor(Math.random() * 30) + 5,
      }));
      const totalStock = sizes.reduce((sum, s) => sum + s.quantity, 0);

      await Product.create({
        name: p.name,
        category: categoryDocs[p.categoryIndex]._id,
        price: p.price,
        discount: p.discount,
        image: productImage(p.imageId),
        subImage: [
          productImage(p.imageId + 100),
          productImage(p.imageId + 200),
        ],
        description: p.description,
        isNewProduct: p.isNewProduct,
        hasSizes: true,
        stock: totalStock,
        sizes,
        isActive: true,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0–5.0
        createdBy: admin._id,
      });
      productCount++;
      console.log(`  + Created product "${p.name}" (${totalStock} in stock)`);
    }
    if (productCount === 0) console.log("  ✓ All products already exist");

    // 5. Policies
    console.log("\n── Seeding Policies ──");
    for (const policy of POLICIES) {
      const existing = await Policy.findOne({ type: policy.type });
      if (existing) {
        console.log(`  ✓ Policy "${policy.type}" already exists`);
        continue;
      }
      await Policy.create({
        ...policy,
        content: sanitizePolicyContent
          ? sanitizePolicyContent(policy.content)
          : policy.content,
        isPublished: true,
        updatedBy: admin._id,
      });
      console.log(`  + Created policy "${policy.type}"`);
    }

    // ── Summary ──
    console.log("\n══════════════════════════════════════");
    console.log("  ✅ Seed hoàn tất!");
    console.log("══════════════════════════════════════");
    console.log(`  Roles:      ${await Role.countDocuments()}`);
    console.log(`  Users:      ${await User.countDocuments()}`);
    console.log(`  Categories: ${await Category.countDocuments()}`);
    console.log(`  Products:   ${await Product.countDocuments()}`);
    console.log(`  Policies:   ${await Policy.countDocuments()}`);
    console.log("──────────────────────────────────────");
    console.log("  🔑 Admin:    admin@defashion.com / Admin@123");
    console.log("  👤 Customer: customer1@example.com / User@123");
    console.log("══════════════════════════════════════\n");
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((err) => {
  console.error("❌ Seed thất bại:", err.message);
  process.exitCode = 1;
});
