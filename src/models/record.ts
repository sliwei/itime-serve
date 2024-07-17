import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../utils/sequelize'
import dayjs from 'dayjs'

export class Record extends Model {
  declare id: number
  /* 文本 */
  declare message: string
  /* 媒体 */
  declare media: string
  /* 地址 */
  declare address: string
  /* 坐标 */
  declare coordinates: string
  /* 升身高 */
  declare height: number
  /* 体重 */
  declare weight: number
  /* 发表时间 */
  declare etime: string
  /* 创建人id */
  declare cid: string
  /* 创建人name */
  declare cname: string
  declare del: number
  declare ctime: string
  declare utime: string
}

Record.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.STRING(2000), comment: '文本' },
    media: { type: DataTypes.STRING(2000), comment: '媒体' },
    address: { type: DataTypes.STRING(50), comment: '地址' },
    coordinates: { type: DataTypes.STRING(50), comment: '坐标' },
    height: { type: DataTypes.FLOAT, comment: '身高' },
    weight: { type: DataTypes.FLOAT, comment: '体重' },
    etime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '发表时间',
      get() {
        return dayjs(this.getDataValue('etime')).format('YYYY-MM-DD HH:mm:ss')
      }
    },
    cid: { type: DataTypes.INTEGER, comment: '创建人id' },
    cname: { type: DataTypes.STRING(50), comment: '创建人name' },
    del: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  {
    getterMethods: {
      ctime() {
        return dayjs(this.getDataValue('ctime')).format('YYYY-MM-DD HH:mm:ss')
      },
      utime() {
        return dayjs(this.getDataValue('utime')).format('YYYY-MM-DD HH:mm:ss')
      }
    },
    comment: '记录',
    tableName: 'record',
    timestamps: true,
    createdAt: 'ctime',
    updatedAt: 'utime',
    sequelize
  }
)
