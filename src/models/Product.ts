import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Definir los atributos del producto
interface ProductAttributes {
  id: number;
  ean: string;
  name: string;
  original_name?: string;
  brand: string;
  page?: string;
  url?: string;
  description?: string;
  category?: string;
  type?: string;
  variety?: string;
  image_filename?: string;
  available?: boolean;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Atributos opcionales para la creación
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Clase del modelo
class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public ean!: string; 
  public name!: string; 
  public original_name?: string;
  public brand!: string;
  public page?: string;
  public url?: string;
  public description?: string;
  public category?: string;
  public type?: string;
  public variety?: string;
  public image_filename?: string;
  public available?: boolean;
  public comments?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inicializar el modelo
Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ean: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, 
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    page: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    variety: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    image_filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: false,
    indexes: [
      {
        fields: ['brand'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['name'],
      },
    ],
  }
);

export default Product;
