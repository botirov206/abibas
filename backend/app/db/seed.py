"""
Run with: uv run python -m app.db.seed
"""
from datetime import date, timedelta
from sqlmodel import Session, select
from app.db.session import engine
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse, Zone, Bin, ZoneType
from app.models.product import Category, Supplier, Product, ProductSpec
from app.models.inventory import InventoryBatch, QualityStatus
from app.models.purchase_order import PurchaseOrder, POItem, POStatus
from app.models.sales_order import SalesOrder, SOItem, SOStatus
from app.models.movement import StockMovement, MovementType


def seed():
    with Session(engine) as s:
        # ── Users ─────────────────────────────────────────────────────────
        pw = hash_password("pass1234")
        users = [
            User(name="Admin User",       email="admin@stockpilot.com",       password_hash=pw, role=UserRole.ADMIN),
            User(name="Jack Operator",    email="operator@stockpilot.com",    password_hash=pw, role=UserRole.WAREHOUSE_OPERATOR),
            User(name="Sara Procurement", email="procurement@stockpilot.com", password_hash=pw, role=UserRole.PROCUREMENT),
            User(name="Lin QC",           email="qc@stockpilot.com",          password_hash=pw, role=UserRole.QC_INSPECTOR),
            User(name="Tom Manager",      email="manager@stockpilot.com",     password_hash=pw, role=UserRole.MANAGER),
        ]
        for u in users:
            s.add(u)
        s.commit()
        for u in users:
            s.refresh(u)
        admin, operator, procurement, qc, manager = users

        # ── Warehouses ────────────────────────────────────────────────────
        wh1 = Warehouse(name="London Fashion Hub",      location="Stratford, London",      total_area_sqm=6000.0)
        wh2 = Warehouse(name="Manchester Fulfilment",   location="Trafford Park, Manchester", total_area_sqm=4200.0)
        s.add(wh1); s.add(wh2); s.commit()
        s.refresh(wh1); s.refresh(wh2)

        # ── Zones ─────────────────────────────────────────────────────────
        zone_data = [
            (wh1.id, "Receiving Bay",     ZoneType.RECEIVING),
            (wh1.id, "Main Storage",      ZoneType.STORAGE),
            (wh1.id, "Dispatch",          ZoneType.SHIPPING),
            (wh1.id, "Quarantine Hold",   ZoneType.QUARANTINE),
            (wh2.id, "Inbound Dock",      ZoneType.RECEIVING),
            (wh2.id, "Racking A",         ZoneType.STORAGE),
            (wh2.id, "Outbound Bay",      ZoneType.SHIPPING),
            (wh2.id, "QC Hold",           ZoneType.QUARANTINE),
        ]
        zones = []
        for wid, name, zt in zone_data:
            z = Zone(warehouse_id=wid, name=name, zone_type=zt)
            s.add(z); s.commit(); s.refresh(z)
            zones.append(z)
        wh1_receiving, wh1_storage, wh1_shipping, wh1_quarantine, \
            wh2_receiving, wh2_storage, wh2_shipping, wh2_quarantine = zones

        # ── Bins ──────────────────────────────────────────────────────────
        bin_data = [
            (wh1_storage.id,    "LON-A-01-01", 800),
            (wh1_storage.id,    "LON-A-01-02", 800),
            (wh1_storage.id,    "LON-A-02-01", 600),
            (wh1_storage.id,    "LON-B-01-01", 1000),
            (wh1_quarantine.id, "LON-Q-01-01", 300),
            (wh2_storage.id,    "MCR-A-01-01", 700),
            (wh2_storage.id,    "MCR-A-01-02", 700),
            (wh2_storage.id,    "MCR-B-01-01", 500),
            (wh2_quarantine.id, "MCR-Q-01-01", 300),
        ]
        bins = []
        for zid, code, cap in bin_data:
            b = Bin(zone_id=zid, code=code, max_capacity=cap)
            s.add(b); s.commit(); s.refresh(b)
            bins.append(b)
        b1, b2, b3, b4, bq1, b5, b6, b7, bq2 = bins

        # ── Categories ────────────────────────────────────────────────────
        cat_footwear   = Category(name="Footwear")
        cat_apparel    = Category(name="Apparel")
        cat_accessories = Category(name="Accessories")
        for c in [cat_footwear, cat_apparel, cat_accessories]:
            s.add(c)
        s.commit()
        for c in [cat_footwear, cat_apparel, cat_accessories]:
            s.refresh(c)

        cat_sneakers     = Category(name="Sneakers",            parent_id=cat_footwear.id)
        cat_running      = Category(name="Running Shoes",       parent_id=cat_footwear.id)
        cat_tops         = Category(name="T-Shirts & Tops",     parent_id=cat_apparel.id)
        cat_hoodies      = Category(name="Hoodies & Sweatshirts", parent_id=cat_apparel.id)
        cat_bottoms      = Category(name="Bottoms & Pants",     parent_id=cat_apparel.id)
        cat_bags         = Category(name="Bags",                parent_id=cat_accessories.id)
        for c in [cat_sneakers, cat_running, cat_tops, cat_hoodies, cat_bottoms, cat_bags]:
            s.add(c)
        s.commit()
        for c in [cat_sneakers, cat_running, cat_tops, cat_hoodies, cat_bottoms, cat_bags]:
            s.refresh(c)

        # ── Suppliers ─────────────────────────────────────────────────────
        nike   = Supplier(company_name="Nike AG",   contact_name="Michael Chen",   email="wholesale@nike.com",   phone="+49 89 9938 0000", country="DE", lead_time_days=7)
        adidas = Supplier(company_name="Adidas AG", contact_name="Anna Müller",    email="wholesale@adidas.com", phone="+49 9132 84 0",    country="DE", lead_time_days=7)
        puma   = Supplier(company_name="Puma SE",   contact_name="Thomas Fischer", email="wholesale@puma.com",   phone="+49 9132 81 0",    country="DE", lead_time_days=10)
        for sup in [nike, adidas, puma]:
            s.add(sup)
        s.commit()
        for sup in [nike, adidas, puma]:
            s.refresh(sup)

        # ── Products ──────────────────────────────────────────────────────
        # (name, part_number, category_id, description, uom, reorder_point, reorder_qty, image_url)
        products_data = [
            # ── Nike ────────────────────────────────────────────────────
            (
                "Nike Air Force 1 '07 Low White",
                "NK-AF1-07-WHT",
                cat_sneakers.id,
                "Timeless low-top leather sneaker with Air-Sole cushioning. The AF1 that started it all.",
                "PAIR", 30, 120,
                "https://shopcgx.com/cdn/shop/products/CW2288-111.jpg?v=1653611464",
            ),
            (
                "Nike Air Max 90 Triple White",
                "NK-AM90-WHT",
                cat_sneakers.id,
                "Iconic running-inspired silhouette with visible Max Air unit in heel.",
                "PAIR", 25, 100,
                "https://shopcgx.com/cdn/shop/files/CN8490-100-PHSRH000.jpg?v=1709313522",
            ),
            (
                "Nike Air Max 270 White/Black",
                "NK-AM270-WBK",
                cat_running.id,
                "Lifestyle running shoe with the tallest Air unit ever made — 270 degrees of cushioning.",
                "PAIR", 20, 80,
                "https://www.shopwss.com/cdn/shop/files/AH8050100_1.jpg?v=1775581984",
            ),
            (
                "Nike Dri-FIT Training T-Shirt",
                "NK-DFIT-TEE-BLK",
                cat_tops.id,
                "Sweat-wicking Dri-FIT fabric keeps you dry and comfortable through intense workouts.",
                "PCS", 50, 200,
                "https://shopcgx.com/cdn/shop/products/CZ9724_2.jpg?v=1715263082",
            ),
            (
                "Nike Tech Fleece Full-Zip Hoodie",
                "NK-TECH-FZ-BLK",
                cat_hoodies.id,
                "Engineered spacer fabric delivers warmth without the weight. Slim-fit silhouette.",
                "PCS", 20, 80,
                "https://www.dtlr.com/cdn/shop/products/Nike-CU4489-010-MTechHoodie-054.jpg?v=1694810385",
            ),
            (
                "Nike Dri-FIT Challenger 7\" Running Shorts",
                "NK-CHL-SHRT-BLK",
                cat_bottoms.id,
                "Lightweight, ventilated 7-inch shorts with inner brief for unrestricted movement.",
                "PCS", 40, 150,
                "https://shopcgx.com/cdn/shop/files/DV9359-010-PHSFM001.jpg?v=1715262049",
            ),

            # ── Adidas ──────────────────────────────────────────────────
            (
                "Adidas Stan Smith White/Green",
                "AD-STAN-FX5502",
                cat_sneakers.id,
                "The legendary tennis shoe turned street icon. Clean leather upper with signature three stripes.",
                "PAIR", 30, 120,
                "https://www.sneakersnstuff.com/cdn/shop/files/FX5502_1_FOOTWEAR_Photography_Side_Lateral_Center_View_white__11302.1742180155.1280.1280.jpg",
            ),
            (
                "Adidas Superstar White/Black",
                "AD-SUP-EG4958",
                cat_sneakers.id,
                "The shell-toe original — rubber shell toe and leather upper, a streetwear staple since 1969.",
                "PAIR", 25, 100,
                "https://www.topsandbottomsusa.com/cdn/shop/files/EG4958-01_a7f1720e-2389-4398-a4ca-c7368e430b66_png.jpg?v=1762561889&width=1500",
            ),
            (
                "Adidas Ultraboost 22 Triple Black",
                "AD-UB22-GZ0127",
                cat_running.id,
                "Responsive BOOST midsole and Primeknit+ upper for elite running performance.",
                "PAIR", 15, 60,
                "https://media.sivasdescalzo.com/media/catalog/product/G/Z/GZ0127_sivasdescalzo-adidas-ULTRABOOST_22-1637757029-1.jpg",
            ),
            (
                "Adidas Essentials Fleece Sweatshirt",
                "AD-ESS-FLC-SWT",
                cat_hoodies.id,
                "Soft fleece fabric with iconic 3-stripe branding. Relaxed fit for everyday comfort.",
                "PCS", 40, 160,
                "https://shopcgx.com/cdn/shop/files/JD1874_2_APPAREL_3D-Rendering_FrontView_white.jpg?v=1722002089",
            ),
            (
                "Adidas Tiro 21 Training Pants",
                "AD-TIRO21-GJ9868",
                cat_bottoms.id,
                "Tapered training pants with AEROREADY moisture management. Football-inspired design.",
                "PCS", 35, 140,
                "https://soccerzoneusa.com/cdn/shop/products/GJ9868_023_M1_671x.jpg?v=1612114219",
            ),
            (
                "Adidas Trefoil T-Shirt Blue",
                "AD-TRF-TEE-H06638",
                cat_tops.id,
                "Classic cotton tee with the iconic Trefoil logo. Essential streetwear staple.",
                "PCS", 50, 200,
                "https://www.topsandbottomsusa.com/cdn/shop/files/Adicolor_Classics_Trefoil_Tee_Blue_H06638_21_model_acf1cc53-687a-4782-a5a1-0bba903461d4_png.jpg?v=1762567821&width=1500",
            ),

            # ── Puma ────────────────────────────────────────────────────
            (
                "Puma Suede Classic XXI Black",
                "PM-SUED-399781",
                cat_sneakers.id,
                "The suede that changed the game since 1968. Plush suede upper, rubber cupsole.",
                "PAIR", 25, 100,
                "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/399781/01/sv01/fnd/PNA/fmt/png/Suede-Classic-Sneakers",
            ),
            (
                "Puma RS-X3 White/Dazzling Blue",
                "PM-RSX3-371570",
                cat_running.id,
                "Reinvented Running System with chunky layered design and mesh/synthetic upper.",
                "PAIR", 20, 80,
                "https://www.ruzeshoes.com/cdn/shop/products/37157015_rs-x3_puzzle_puma_black_puma_white_01_large.jpg?v=1587098193",
            ),
            (
                "Puma Essentials Logo T-Shirt",
                "PM-ESS-TEE-678776",
                cat_tops.id,
                "Soft cotton jersey tee with subtle Puma Cat logo. Versatile everyday essential.",
                "PCS", 50, 200,
                "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/678776/46/fnd/PNA/fmt/png/Essentials-Men's-Logo-Tee",
            ),
            (
                "Puma Evostripe Joggers Black",
                "PM-EVS-JGR-688234",
                cat_bottoms.id,
                "Slim tapered joggers with DryCell moisture-wicking technology and side pockets.",
                "PCS", 35, 140,
                "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/688234/01/fnd/PNA/fmt/png/Evostripe-Men's-Pants",
            ),
            (
                "Puma Better Foam Emerge Street Shoes",
                "PM-BF-EMG-195467",
                cat_running.id,
                "Better Foam midsole for responsive cushioning. Engineered mesh upper for breathability.",
                "PAIR", 20, 80,
                "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/195467/09/sv01/fnd/PNA/fmt/png/Better-Foam-Emerge-Street-Men's-Running-Shoes",
            ),
            (
                "Puma Fundamentals Sports Bag S",
                "PM-FUND-BAG-079230",
                cat_bags.id,
                "Compact gym bag with main compartment, front zip pocket, and adjustable shoulder strap.",
                "PCS", 20, 60,
                "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/079230/08/fnd/PNA/fmt/png/Fundamentals-Sports-Bag-S",
            ),
            (
                "Nike Court Vision Low White",
                "NK-CRTVIS-WHT",
                cat_sneakers.id,
                "Basketball-inspired sneaker with perforated leather upper and herringbone rubber outsole.",
                "PAIR", 25, 100,
                "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/5f76c42f-7afa-4c59-a4a3-dcb91ac92da9/court-vision-low-next-nature-shoes-B9VDTp.png",
            ),
            (
                "Adidas Forum Low White/Black",
                "AD-FRM-LOW-FY7755",
                cat_sneakers.id,
                "Iconic basketball-heritage silhouette with ankle strap and leather upper.",
                "PAIR", 25, 100,
                "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/3d6e3c666a5b4f34a3d6ad3d012b0d6b_9366/Forum_Low_Shoes_White_FY7755_01_standard.jpg",
            ),
        ]

        products = []
        for name, pn, cat_id, desc, uom, rp, rq, img in products_data:
            p = Product(name=name, part_number=pn, category_id=cat_id, description=desc, unit_of_measure=uom, reorder_point=rp, reorder_qty=rq, image_url=img)
            s.add(p); s.commit(); s.refresh(p)
            products.append(p)

        (nk_af1, nk_am90, nk_am270, nk_dfit_tee, nk_tech_hoodie, nk_shorts,
         ad_stan, ad_superstar, ad_ultraboost, ad_sweatshirt, ad_tiro_pants, ad_trefoil_tee,
         pm_suede, pm_rsx3, pm_ess_tee, pm_evostripe, pm_better_foam, pm_bag,
         nk_court_vision, ad_forum) = products

        # ── Product Specs ─────────────────────────────────────────────────
        specs = [
            # Nike AF1
            (nk_af1.id, "Colorway", "White/White"),
            (nk_af1.id, "Upper", "Full-grain leather"),
            (nk_af1.id, "Sole", "Rubber outsole"),
            (nk_af1.id, "Sizes Available", "UK 6–13"),
            # Nike AM90
            (nk_am90.id, "Colorway", "Triple White"),
            (nk_am90.id, "Upper", "Leather & mesh"),
            (nk_am90.id, "Cushioning", "Max Air heel unit"),
            (nk_am90.id, "Sizes Available", "UK 6–13"),
            # Nike AM270
            (nk_am270.id, "Colorway", "White/Black"),
            (nk_am270.id, "Upper", "Engineered mesh"),
            (nk_am270.id, "Air Unit", "270° Max Air"),
            (nk_am270.id, "Sizes Available", "UK 6–13"),
            # Nike Dri-FIT Tee
            (nk_dfit_tee.id, "Material", "100% Polyester"),
            (nk_dfit_tee.id, "Technology", "Dri-FIT"),
            (nk_dfit_tee.id, "Fit", "Standard"),
            (nk_dfit_tee.id, "Sizes", "XS–3XL"),
            # Nike Tech Fleece Hoodie
            (nk_tech_hoodie.id, "Material", "56% Cotton / 44% Polyester"),
            (nk_tech_hoodie.id, "Technology", "Tech Fleece"),
            (nk_tech_hoodie.id, "Fit", "Slim"),
            (nk_tech_hoodie.id, "Sizes", "XS–3XL"),
            # Nike Shorts
            (nk_shorts.id, "Length", "7 inches"),
            (nk_shorts.id, "Technology", "Dri-FIT"),
            (nk_shorts.id, "Feature", "Built-in brief"),
            (nk_shorts.id, "Sizes", "XS–3XL"),
            # Adidas Stan Smith
            (ad_stan.id, "Colorway", "Cloud White / Green"),
            (ad_stan.id, "Upper", "Leather"),
            (ad_stan.id, "Sole", "Rubber cupsole"),
            (ad_stan.id, "Sizes Available", "UK 4–13"),
            # Adidas Superstar
            (ad_superstar.id, "Colorway", "White/Core Black"),
            (ad_superstar.id, "Upper", "Leather"),
            (ad_superstar.id, "Feature", "Shell toe"),
            (ad_superstar.id, "Sizes Available", "UK 4–13"),
            # Adidas Ultraboost
            (ad_ultraboost.id, "Colorway", "Triple Black"),
            (ad_ultraboost.id, "Upper", "Primeknit+"),
            (ad_ultraboost.id, "Midsole", "BOOST"),
            (ad_ultraboost.id, "Sizes Available", "UK 4–13"),
            # Adidas Sweatshirt
            (ad_sweatshirt.id, "Material", "70% Cotton / 30% Polyester"),
            (ad_sweatshirt.id, "Fit", "Regular"),
            (ad_sweatshirt.id, "Feature", "3-Stripe branding"),
            (ad_sweatshirt.id, "Sizes", "XS–3XL"),
            # Adidas Tiro Pants
            (ad_tiro_pants.id, "Material", "100% Polyester"),
            (ad_tiro_pants.id, "Technology", "AEROREADY"),
            (ad_tiro_pants.id, "Fit", "Tapered"),
            (ad_tiro_pants.id, "Sizes", "XS–3XL"),
            # Adidas Trefoil Tee
            (ad_trefoil_tee.id, "Material", "100% Cotton"),
            (ad_trefoil_tee.id, "Fit", "Regular"),
            (ad_trefoil_tee.id, "Colorway", "Blue"),
            (ad_trefoil_tee.id, "Sizes", "XS–3XL"),
            # Puma Suede
            (pm_suede.id, "Colorway", "Black/Black"),
            (pm_suede.id, "Upper", "Suede"),
            (pm_suede.id, "Sole", "Rubber cupsole"),
            (pm_suede.id, "Sizes Available", "UK 4–13"),
            # Puma RS-X3
            (pm_rsx3.id, "Colorway", "White/Dazzling Blue"),
            (pm_rsx3.id, "Upper", "Mesh & synthetic"),
            (pm_rsx3.id, "Sole", "Chunky RS unit"),
            (pm_rsx3.id, "Sizes Available", "UK 4–13"),
            # Puma Ess Tee
            (pm_ess_tee.id, "Material", "100% Cotton"),
            (pm_ess_tee.id, "Fit", "Regular"),
            (pm_ess_tee.id, "Colorway", "Green Moss"),
            (pm_ess_tee.id, "Sizes", "XS–3XL"),
            # Puma Evostripe Joggers
            (pm_evostripe.id, "Material", "Polyester"),
            (pm_evostripe.id, "Technology", "DryCell"),
            (pm_evostripe.id, "Fit", "Slim tapered"),
            (pm_evostripe.id, "Sizes", "XS–3XL"),
            # Puma Better Foam
            (pm_better_foam.id, "Upper", "Engineered mesh"),
            (pm_better_foam.id, "Midsole", "Better Foam"),
            (pm_better_foam.id, "Outsole", "Rubber"),
            (pm_better_foam.id, "Sizes Available", "UK 6–13"),
            # Puma Bag
            (pm_bag.id, "Volume", "20 litres"),
            (pm_bag.id, "Dimensions", "45 x 28 x 28 cm"),
            (pm_bag.id, "Material", "Polyester"),
            (pm_bag.id, "Feature", "Adjustable strap"),
            # Nike Court Vision
            (nk_court_vision.id, "Colorway", "White/White"),
            (nk_court_vision.id, "Upper", "Perforated leather"),
            (nk_court_vision.id, "Outsole", "Herringbone rubber"),
            (nk_court_vision.id, "Sizes Available", "UK 6–13"),
            # Adidas Forum Low
            (ad_forum.id, "Colorway", "White/Core Black"),
            (ad_forum.id, "Upper", "Leather"),
            (ad_forum.id, "Feature", "Ankle strap"),
            (ad_forum.id, "Sizes Available", "UK 4–13"),
        ]
        for pid, sn, sv in specs:
            s.add(ProductSpec(product_id=pid, spec_name=sn, spec_value=sv))
        s.commit()

        # ── Inventory Batches ─────────────────────────────────────────────
        today = date.today()
        batch_data = [
            # Nike AF1 — in stock at both warehouses
            (nk_af1.id,          b1.id,  240, "LOT-NK-AF1-001",    today - timedelta(days=45), None, QualityStatus.RELEASED),
            (nk_af1.id,          b5.id,  180, "LOT-NK-AF1-002",    today - timedelta(days=30), None, QualityStatus.RELEASED),
            # Nike AM90
            (nk_am90.id,         b1.id,  160, "LOT-NK-AM90-001",   today - timedelta(days=60), None, QualityStatus.RELEASED),
            (nk_am90.id,         bq1.id,  12, "LOT-NK-AM90-002",   today - timedelta(days=5),  None, QualityStatus.QUARANTINE),
            # Nike AM270
            (nk_am270.id,        b2.id,  120, "LOT-NK-AM270-001",  today - timedelta(days=20), None, QualityStatus.RELEASED),
            # Nike Dri-FIT Tee
            (nk_dfit_tee.id,     b2.id,  360, "LOT-NK-DFIT-001",   today - timedelta(days=15), None, QualityStatus.RELEASED),
            (nk_dfit_tee.id,     b6.id,  280, "LOT-NK-DFIT-002",   today - timedelta(days=10), None, QualityStatus.RELEASED),
            # Nike Tech Hoodie
            (nk_tech_hoodie.id,  b3.id,  95,  "LOT-NK-TECH-001",   today - timedelta(days=25), None, QualityStatus.RELEASED),
            (nk_tech_hoodie.id,  bq2.id,  8,  "LOT-NK-TECH-002",   today - timedelta(days=3),  None, QualityStatus.QUARANTINE),
            # Nike Shorts
            (nk_shorts.id,       b3.id,  220, "LOT-NK-SHRT-001",   today - timedelta(days=18), None, QualityStatus.RELEASED),
            # Adidas Stan Smith
            (ad_stan.id,         b4.id,  200, "LOT-AD-STAN-001",   today - timedelta(days=50), None, QualityStatus.RELEASED),
            (ad_stan.id,         b6.id,  150, "LOT-AD-STAN-002",   today - timedelta(days=35), None, QualityStatus.RELEASED),
            # Adidas Superstar
            (ad_superstar.id,    b4.id,  175, "LOT-AD-SUP-001",    today - timedelta(days=40), None, QualityStatus.RELEASED),
            (ad_superstar.id,    bq1.id,  10, "LOT-AD-SUP-002",    today - timedelta(days=4),  None, QualityStatus.QUARANTINE),
            # Adidas Ultraboost
            (ad_ultraboost.id,   b5.id,   55, "LOT-AD-UB22-001",   today - timedelta(days=30), None, QualityStatus.RELEASED),
            # Adidas Sweatshirt
            (ad_sweatshirt.id,   b7.id,  310, "LOT-AD-ESS-001",    today - timedelta(days=22), None, QualityStatus.RELEASED),
            # Adidas Tiro Pants
            (ad_tiro_pants.id,   b7.id,  260, "LOT-AD-TIRO-001",   today - timedelta(days=28), None, QualityStatus.RELEASED),
            # Adidas Trefoil Tee
            (ad_trefoil_tee.id,  b6.id,  400, "LOT-AD-TRF-001",    today - timedelta(days=12), None, QualityStatus.RELEASED),
            # Puma Suede
            (pm_suede.id,        b2.id,  140, "LOT-PM-SUED-001",   today - timedelta(days=55), None, QualityStatus.RELEASED),
            # Puma RS-X3
            (pm_rsx3.id,         b3.id,  100, "LOT-PM-RSX3-001",   today - timedelta(days=42), None, QualityStatus.RELEASED),
            # Puma Ess Tee
            (pm_ess_tee.id,      b1.id,  350, "LOT-PM-ESS-001",    today - timedelta(days=8),  None, QualityStatus.RELEASED),
            # Puma Evostripe
            (pm_evostripe.id,    b4.id,  230, "LOT-PM-EVS-001",    today - timedelta(days=16), None, QualityStatus.RELEASED),
            # Puma Better Foam
            (pm_better_foam.id,  b5.id,   70, "LOT-PM-BF-001",     today - timedelta(days=20), None, QualityStatus.RELEASED),
            # Puma Bag
            (pm_bag.id,          b7.id,   85, "LOT-PM-BAG-001",    today - timedelta(days=33), None, QualityStatus.RELEASED),
            # Nike Court Vision
            (nk_court_vision.id, b1.id,  190, "LOT-NK-CRTV-001",   today - timedelta(days=14), None, QualityStatus.RELEASED),
            # Adidas Forum
            (ad_forum.id,        b4.id,  165, "LOT-AD-FRM-001",    today - timedelta(days=38), None, QualityStatus.RELEASED),
        ]
        batches = []
        for pid, bid, qty, lot, recv, exp, qs in batch_data:
            b = InventoryBatch(product_id=pid, bin_id=bid, quantity=qty, lot_number=lot, received_date=recv, expiry_date=exp, quality_status=qs)
            s.add(b); s.commit(); s.refresh(b)
            batches.append(b)

        # ── Purchase Orders ───────────────────────────────────────────────
        po_nike   = PurchaseOrder(supplier_id=nike.id,   status=POStatus.RECEIVED,           expected_date=today - timedelta(days=30), notes="Spring/Summer Nike footwear & apparel restock",    created_by_id=procurement.id)
        po_adidas = PurchaseOrder(supplier_id=adidas.id, status=POStatus.PARTIALLY_RECEIVED, expected_date=today + timedelta(days=5),  notes="Adidas Originals + performance apparel order",      created_by_id=procurement.id)
        po_puma   = PurchaseOrder(supplier_id=puma.id,   status=POStatus.DRAFT,              expected_date=today + timedelta(days=14), notes="Puma lifestyle & running shoes reorder",            created_by_id=procurement.id)
        for po in [po_nike, po_adidas, po_puma]:
            s.add(po)
        s.commit()
        for po in [po_nike, po_adidas, po_puma]:
            s.refresh(po)

        po_items = [
            # Nike PO — fully received
            POItem(po_id=po_nike.id,   product_id=nk_af1.id,         quantity_ordered=240,  quantity_received=240,  unit_cost=62.00),
            POItem(po_id=po_nike.id,   product_id=nk_am90.id,        quantity_ordered=160,  quantity_received=160,  unit_cost=75.00),
            POItem(po_id=po_nike.id,   product_id=nk_dfit_tee.id,    quantity_ordered=400,  quantity_received=400,  unit_cost=18.00),
            POItem(po_id=po_nike.id,   product_id=nk_tech_hoodie.id, quantity_ordered=100,  quantity_received=100,  unit_cost=55.00),
            # Adidas PO — partially received
            POItem(po_id=po_adidas.id, product_id=ad_stan.id,         quantity_ordered=200,  quantity_received=200,  unit_cost=48.00),
            POItem(po_id=po_adidas.id, product_id=ad_superstar.id,    quantity_ordered=200,  quantity_received=175,  unit_cost=50.00),
            POItem(po_id=po_adidas.id, product_id=ad_trefoil_tee.id,  quantity_ordered=500,  quantity_received=400,  unit_cost=16.00),
            POItem(po_id=po_adidas.id, product_id=ad_tiro_pants.id,   quantity_ordered=300,  quantity_received=260,  unit_cost=28.00),
            # Puma PO — draft, none received
            POItem(po_id=po_puma.id,   product_id=pm_suede.id,        quantity_ordered=150,  quantity_received=0,    unit_cost=42.00),
            POItem(po_id=po_puma.id,   product_id=pm_rsx3.id,         quantity_ordered=100,  quantity_received=0,    unit_cost=55.00),
            POItem(po_id=po_puma.id,   product_id=pm_better_foam.id,  quantity_ordered=100,  quantity_received=0,    unit_cost=44.00),
        ]
        for pi in po_items:
            s.add(pi)
        s.commit()

        # ── Sales Orders ──────────────────────────────────────────────────
        so1 = SalesOrder(customer_ref="Urban Outfitters UK PO-2026-0341",  customer_email="buying@urbanoutfitters.co.uk", status=SOStatus.PROCESSING,  ship_by_date=today + timedelta(days=4),  created_by_id=admin.id)
        so2 = SalesOrder(customer_ref="ASOS Wholesale PO-2026-0892",       customer_email="wholesale@asos.com",           status=SOStatus.PENDING,      ship_by_date=today + timedelta(days=10), created_by_id=admin.id)
        so3 = SalesOrder(customer_ref="JD Sports Distribution PO-2026-119",customer_email="distribution@jdsports.co.uk",  status=SOStatus.SHIPPED,      ship_by_date=today - timedelta(days=2),  created_by_id=admin.id)
        for so in [so1, so2, so3]:
            s.add(so)
        s.commit()
        for so in [so1, so2, so3]:
            s.refresh(so)

        so_items = [
            SOItem(so_id=so1.id, product_id=nk_af1.id,         quantity=60,  unit_price=99.99),
            SOItem(so_id=so1.id, product_id=ad_stan.id,         quantity=40,  unit_price=84.99),
            SOItem(so_id=so1.id, product_id=nk_dfit_tee.id,     quantity=80,  unit_price=34.99),
            SOItem(so_id=so2.id, product_id=ad_superstar.id,    quantity=50,  unit_price=89.99),
            SOItem(so_id=so2.id, product_id=pm_suede.id,        quantity=30,  unit_price=74.99),
            SOItem(so_id=so2.id, product_id=ad_trefoil_tee.id,  quantity=100, unit_price=29.99),
            SOItem(so_id=so3.id, product_id=nk_am90.id,         quantity=40,  unit_price=119.99),
            SOItem(so_id=so3.id, product_id=ad_ultraboost.id,   quantity=20,  unit_price=149.99),
            SOItem(so_id=so3.id, product_id=pm_rsx3.id,         quantity=25,  unit_price=94.99),
        ]
        for si in so_items:
            s.add(si)
        s.commit()

        # ── Stock Movements ───────────────────────────────────────────────
        movements = [
            # Nike receipts
            StockMovement(product_id=nk_af1.id,         to_bin_id=b1.id,  quantity=240, movement_type=MovementType.RECEIVE,    reference_po_id=po_nike.id,   performed_by_id=operator.id, notes="Nike PO full receipt - AF1"),
            StockMovement(product_id=nk_am90.id,        to_bin_id=b1.id,  quantity=160, movement_type=MovementType.RECEIVE,    reference_po_id=po_nike.id,   performed_by_id=operator.id, notes="Nike PO full receipt - AM90"),
            StockMovement(product_id=nk_dfit_tee.id,    to_bin_id=b2.id,  quantity=400, movement_type=MovementType.RECEIVE,    reference_po_id=po_nike.id,   performed_by_id=operator.id, notes="Nike PO apparel receipt"),
            StockMovement(product_id=nk_tech_hoodie.id, to_bin_id=b3.id,  quantity=100, movement_type=MovementType.RECEIVE,    reference_po_id=po_nike.id,   performed_by_id=operator.id, notes="Nike Tech Fleece received"),
            # Adidas receipts
            StockMovement(product_id=ad_stan.id,        to_bin_id=b4.id,  quantity=200, movement_type=MovementType.RECEIVE,    reference_po_id=po_adidas.id, performed_by_id=operator.id, notes="Adidas Stan Smith received"),
            StockMovement(product_id=ad_superstar.id,   to_bin_id=b4.id,  quantity=175, movement_type=MovementType.RECEIVE,    reference_po_id=po_adidas.id, performed_by_id=operator.id, notes="Adidas Superstar partial receipt"),
            StockMovement(product_id=ad_superstar.id,   to_bin_id=bq1.id, quantity=10,  movement_type=MovementType.RECEIVE,    reference_po_id=po_adidas.id, performed_by_id=operator.id, notes="Superstar units to quarantine - QC check"),
            # Transfers between warehouses
            StockMovement(product_id=nk_af1.id,         from_bin_id=b1.id, to_bin_id=b5.id, quantity=180, movement_type=MovementType.TRANSFER, performed_by_id=operator.id, notes="Replenish Manchester stock"),
            StockMovement(product_id=nk_dfit_tee.id,    from_bin_id=b2.id, to_bin_id=b6.id, quantity=280, movement_type=MovementType.TRANSFER, performed_by_id=operator.id, notes="Transfer tees to MCR fulfilment"),
            StockMovement(product_id=ad_stan.id,         from_bin_id=b4.id, to_bin_id=b6.id, quantity=150, movement_type=MovementType.TRANSFER, performed_by_id=operator.id, notes="Balance Stan Smith across warehouses"),
            # Shipments
            StockMovement(product_id=nk_af1.id,         from_bin_id=b1.id, quantity=60,  movement_type=MovementType.SHIP, reference_so_id=so1.id, performed_by_id=operator.id, notes="SO1 Urban Outfitters dispatch"),
            StockMovement(product_id=ad_stan.id,         from_bin_id=b4.id, quantity=40,  movement_type=MovementType.SHIP, reference_so_id=so1.id, performed_by_id=operator.id, notes="SO1 Urban Outfitters dispatch"),
            StockMovement(product_id=nk_am90.id,         from_bin_id=b1.id, quantity=40,  movement_type=MovementType.SHIP, reference_so_id=so3.id, performed_by_id=operator.id, notes="SO3 JD Sports dispatch"),
            StockMovement(product_id=ad_ultraboost.id,   from_bin_id=b5.id, quantity=20,  movement_type=MovementType.SHIP, reference_so_id=so3.id, performed_by_id=operator.id, notes="SO3 JD Sports dispatch"),
            # Adjustments
            StockMovement(product_id=nk_am90.id,         from_bin_id=b1.id, quantity=5,   movement_type=MovementType.ADJUSTMENT, performed_by_id=admin.id, notes="Damaged units written off — size 10 mismatch"),
            StockMovement(product_id=pm_ess_tee.id,      to_bin_id=b1.id,  quantity=350, movement_type=MovementType.RECEIVE,   performed_by_id=operator.id, notes="Puma Essentials direct receive"),
        ]
        for m in movements:
            s.add(m)
        s.commit()

        print("Seed complete - Fashion Clothing WMS:")
        print(f"  {len(users)} users · 2 warehouses · 8 zones · 9 bins")
        print(f"  3 suppliers (Nike, Adidas, Puma) · {len(products)} products")
        print(f"  {len(batch_data)} inventory batches (3 in quarantine)")
        print(f"  3 purchase orders · 3 sales orders · {len(movements)} stock movements")


if __name__ == "__main__":
    seed()
