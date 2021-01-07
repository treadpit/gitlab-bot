'use strict';

const Controller = require('egg').Controller;
const S = require('string')

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const { path = '' } = ctx.params

    const wexinWebhookUrl = process.env['WEXIN_WEBHOOK_URL' + (path ? '_' + path.toUpperCase() : '')];
    const dingTalkWebhookUrl = process.env['DINGTALK_WEBHOOK_URL' + (path ? '_' + path.toUpperCase() : '')];

    const webhookUrl = wexinWebhookUrl || dingTalkWebhookUrl
    const isDingTalk = dingTalkWebhookUrl && !wexinWebhookUrl

    ctx.logger.info('request body: ', ctx.request.body);
    const message = await ctx.service.webhook.translateMsg(ctx.request.body);

    if (!message) {
      ctx.logger.info('====> message is empty, suppressed.')
      ctx.body = { msg: 'message is empty or not supported, suppressed.' }
      return 
    }


    if (!webhookUrl) {
      ctx.logger.error('webhook url error: no webhookUrl');
      ctx.body = {
        error: 'webhook url error: no webhookUrl',
      };
      return
    }
    if (isDingTalk) {
      message.markdown.title = 'Gitlab robot say:'
      message.markdown.text = message.markdown.content
      delete message.markdown.content
    }
    const result = await ctx.curl(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=UTF-8',
      },
      // 自动解析 JSON response
      dataType: 'json',
      // 3 秒超时
      timeout: 3000,

      data: message,
    });

    ctx.body = {
      webhook_url: webhookUrl,
      webhook_message: message,
      status: result.status,
      headers: result.headers,
      package: result.data,
    };

    ctx.logger.info('response body: ', ctx.body);
  }
}

module.exports = HomeController;
