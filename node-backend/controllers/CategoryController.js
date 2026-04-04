const { Category, Event, sequelize } = require('../schemas');
const AppError = require('../utils/AppError');

exports.getAllCategories = async () => {
  const categories = await Category.findAll({
    order: [['name', 'ASC']],
  });
  
  const results = [];
  for (const cat of categories) {
    const eventCount = await Event.count({ where: { category_id: cat.id } });
    results.push({ ...cat.toJSON(), eventCount });
  }
  return results;
};

exports.getCategoryById = async (categoryId) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new AppError('Category not found', 404);
  const eventCount = await Event.count({ where: { category_id: category.id } });
  return { ...category.toJSON(), eventCount };
};

exports.createCategory = async ({ name, description, icon }) => {
  if (!name) throw new AppError('Tên danh mục là bắt buộc', 400);

  const exists = await Category.findOne({ where: { name } });
  if (exists) throw new AppError('Danh mục đã tồn tại', 400);

  const category = await Category.create({ name, description, icon });
  return category;
};

exports.updateCategory = async (categoryId, body) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new AppError('Category not found', 404);

  const { name, description, icon, isActive } = body;
  await category.update({ name, description, icon, isActive });
  return category;
};

exports.deleteCategory = async (categoryId) => {
  const t = await sequelize.transaction();
  try {
    const category = await Category.findByPk(categoryId, { transaction: t });
    if (!category) {
      await t.rollback();
      throw new AppError('Category not found', 404);
    }

    await Event.update({ category_id: null }, { where: { category_id: category.id }, transaction: t });
    await category.destroy({ transaction: t });
    await t.commit();
    return { message: 'Đã xóa danh mục' };
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};
