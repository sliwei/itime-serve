import { Context } from 'koa'
import { Record } from '../models/record'
import { Op } from 'sequelize'
import xl from 'excel4node'
import dayjs from 'dayjs'

/**
 * @swagger
 * /api/record/create:
 *   post:
 *     tags:
 *       - record
 *     summary: 新增记录
 *     description: 说明
 *     requestBody:
 *       description: Pet object that needs to be added to the store
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cell:
 *                 type: object
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
export const create = async (ctx: Context) => {
  const { id, name } = ctx.USER
  const { cell } = ctx.request.body
  const res = await Record.create({ ...cell, cid: id, cname: name })
  ctx.DATA.data = res
  ctx.body = ctx.DATA
}

/**
 * @swagger
 * /api/record/update:
 *   put:
 *     tags:
 *       - record
 *     summary: 修改记录
 *     description: 说明
 *     requestBody:
 *       description: Pet object that needs to be added to the store
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: ID
 *               cell:
 *                 type: object
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
export const update = async (ctx: Context) => {
  const { id, cell } = ctx.request.body
  const [uLen] = await Record.update(cell, {
    where: { id }
  })
  if (!uLen) {
    ctx.DATA.code = 1
    ctx.DATA.msg = '未找到数据'
  }
  ctx.body = ctx.DATA
}

/**
 * @swagger
 * /api/record/delete:
 *   delete:
 *     tags:
 *       - record
 *     summary: 删除记录
 *     description: 说明
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: id
 *         type: string
 *         description: ID
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
export const _delete = async (ctx: Context) => {
  const { id } = ctx.query
  const [uLen] = await Record.update(
    { del: 1 },
    {
      where: { id }
    }
  )
  if (!uLen) {
    ctx.DATA.code = 1
    ctx.DATA.msg = '未找到数据'
  }
  ctx.body = ctx.DATA
}

/**
 * @swagger
 * /api/record/select:
 *   get:
 *     tags:
 *       - record
 *     summary: 查询单个记录
 *     description: 说明
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: id
 *         type: string
 *         description: ID
 *       - in: query
 *         name: attributes
 *         type: string
 *         description: 返回字段
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
export const select = async (ctx: Context) => {
  const { id, attributes, ...params } = ctx.query
  const res = await Record.findOne({
    where: { del: 0, id, ...params },
    attributes: attributes ? (attributes as string).split(',') : null
  })
  ctx.DATA.data = res || {}
  if (!res) {
    ctx.DATA.code = 1
    ctx.DATA.msg = '未找到数据'
  }
  ctx.body = ctx.DATA
}

/**
 * @swagger
 * /api/record/findAll:
 *   post:
 *     tags:
 *       - record
 *     summary: 查询记录列表
 *     description: 说明
 *     requestBody:
 *       description: Pet object that needs to be added to the store
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               where:
 *                 type: object
 *               order:
 *                 type: array
 *                 items:
 *                   type: string
 *               page:
 *                 type: number
 *                 description: 页
 *               size:
 *                 type: number
 *                 description: 条数
 *               attributes:
 *                 type: string
 *                 description: 返回字段
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
export const findAll = async (ctx: Context) => {
  const { page = 1, size = 20, attributes, order = [['id', 'DESC']], ...params } = ctx.request.body
  const fixpage = +page
  const fixsize = +size
  const { startTime, endTime, ...term } = params
  const where = {
    del: 0,
    ...term
  }
  if (startTime) {
    where.ctime = {
      [Op.gte]: startTime
    }
  }
  if (endTime) {
    where.ctime = {
      ...where.ctime,
      [Op.lte]: endTime
    }
  }
  const res = await Record.findAndCountAll({
    where,
    offset: fixsize * fixpage - fixsize,
    limit: fixsize,
    order,
    attributes: attributes ? (attributes as string).split(',') : null
  })
  const { rows, count } = res
  const pages = Math.ceil(res.count / size) || 0
  ctx.DATA.data = {
    list: rows,
    page: fixpage,
    size: fixsize,
    total: count,
    pages,
    first: page === 1,
    last: page === pages || !pages
  }
  ctx.body = ctx.DATA
}

/**
 * @swagger
 * /api/record/exportTodayRecord:
 *   get:
 *     tags:
 *       - record
 *     summary: 导出
 *     description: 说明
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: plan
 *         type: string
 *         description: 今日计划/明日计划/今后计划
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
export const exportTodayRecord = async (ctx: Context) => {
  const { plan = '今日计划', ...params } = ctx.query
  let startTime
  let endTime
  let where = {}
  switch (plan) {
    case '今日计划':
      startTime = dayjs().format('YYYY-MM-DD 00:00:00')
      endTime = dayjs().format('YYYY-MM-DD 23:59:59')
      where = {
        ...params,
        last_support_time: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      }
      break
    case '明日计划':
      startTime = dayjs().add(1, 'day').format('YYYY-MM-DD 00:00:00')
      endTime = dayjs().add(1, 'day').format('YYYY-MM-DD 23:59:59')
      where = {
        ...params,
        last_support_time: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      }
      break
    case '今后计划':
      startTime = dayjs().add(2, 'day').format('YYYY-MM-DD 00:00:00')
      endTime = dayjs().add(2, 'day').format('YYYY-MM-DD 23:59:59')
      where = {
        ...params,
        last_support_time: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      }
      break
  }
  const res = await Record.findAll({
    where: {
      del: 0,
      ...where
    },
    order: [['step', 'desc']]
  })
  const title = dayjs(startTime).format('YYYY年MM月DD日计划')
  const wb = new xl.Workbook()
  const ws = wb.addWorksheet(title)
  ws.column(1).setWidth(30)
  ws.column(2).setWidth(30)
  ws.column(4).setWidth(18)
  // ws.row(1).setHeight(20)

  ws.cell(1, 1).string('施工单位')
  ws.cell(1, 2).string('工程名称')
  ws.cell(1, 3).string('方量')
  ws.cell(1, 4).string('时间')
  ws.cell(1, 5).string('浇筑部位')
  ws.cell(1, 6).string('标号')
  ws.cell(1, 7).string('是否需要泵送')
  ws.cell(1, 8).string('联系电话')
  ws.cell(1, 9).string('联系电话')

  const status = ['待审核', '被驳回', '已通过']
  res.forEach((v, i) => {
    // ws.cell(i + 2, 1).string(v.construction)
    // ws.cell(i + 2, 2).string(v.name)
    // ws.cell(i + 2, 3).number(v.volume)
    // ws.cell(i + 2, 4).string(v.support_time)
    // ws.cell(i + 2, 5).string(v.position)
    // ws.cell(i + 2, 6).string(v.level)
    // ws.cell(i + 2, 7).string(v.type)
    // ws.cell(i + 2, 8).string(v.mobile)
    // ws.cell(i + 2, 9).string(v.cancel ? '已撤销' : status[v.status])
  })
  const buffer = await wb.writeToBuffer()
  ctx.set('Content-Disposition', `attachment; filename=${encodeURI(title)}.xlsx`)
  ctx.set('Content-Type', 'application/octet-stream')
  ctx.body = buffer
}

/**
 * @swagger
 * /api/record/getTodayRecord:
 *   get:
 *     tags:
 *       - record
 *     summary: 查询今日/明日/今后记录
 *     description: 说明
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: plan
 *         type: string
 *         description: 今日计划/明日计划/今后计划
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
export const getTodayRecord = async (ctx: Context) => {
  const { plan = '今日计划', ...params } = ctx.query
  let startTime
  let endTime
  let where = {}
  switch (plan) {
    case '今日计划':
      startTime = dayjs().format('YYYY-MM-DD 00:00:00')
      endTime = dayjs().format('YYYY-MM-DD 23:59:59')
      where = {
        ...params,
        last_support_time: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      }
      break
    case '明日计划':
      startTime = dayjs().add(1, 'day').format('YYYY-MM-DD 00:00:00')
      endTime = dayjs().add(1, 'day').format('YYYY-MM-DD 23:59:59')
      where = {
        ...params,
        last_support_time: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      }
      break
    case '今后计划':
      startTime = dayjs().add(2, 'day').format('YYYY-MM-DD 00:00:00')
      endTime = dayjs().add(2, 'day').format('YYYY-MM-DD 23:59:59')
      where = {
        ...params,
        last_support_time: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      }
      break
  }
  const res = await Record.findAll({
    where: {
      del: 0,
      ...where
    },
    order: [['step', 'desc']]
  })
  ctx.DATA.data = res
  ctx.body = ctx.DATA
}
