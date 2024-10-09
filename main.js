const { log } = require('console');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
//截取node main.js 10中的10，用来循环运行
const args = process.argv.slice(2);
const num = args[0] ? Number(args[0]) : null;
// 创建配置文件初始化
const config = {
  RegisteredAddress: [
    'https://signup.live.com/'
  ],
  headless: false, // 开启浏览器无头模式
}
// puppeteer配置隐藏chromedrive特征
let puppeteerConfig = {
  headless: config.headless,
  ignoreHTTPSErrors: true,
  args: [
    '--disable-blink-features=AutomationControlled'
  ],
}
// 随机延迟
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
// 注册逻辑
async function getAccount() {

  let browserStart;
  try {
    browserStart = await puppeteer.launch(puppeteerConfig);//打开浏览器
    const browser = await browserStart.createIncognitoBrowserContext();
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let passWord = await generateRandomPassword(charset, 10);
    let username = await generateRandomPassword(charset, 15);
    let lastName = await generateRandomPassword(charset, 4);
    let firstName = await generateRandomPassword(charset, 4);
    //随机生成1990到2000年的年份
    let year = Math.floor(Math.random() * (2000 - 1990 + 1) + 1990);
    // 随机生成月份
    let month = Math.floor(Math.random() * (12 - 1 + 1) + 1);
    // 随机生成日期
    let day = Math.floor(Math.random() * (28 - 1 + 1) + 1);
    // 判断username是否以字母开头
    let firstChar = username.charAt(0);
    if (!firstChar.match(/[a-zA-Z]/)) {
      username = 'a' + username.substring(1);
    }
    console.log("生成随机邮箱和密码: ", "\n", username + "@outlook.com", "\n", passWord);
    // 打印换行
    console.log();

    console.log("打开outlook注册页面");
    const outlookCreate = await browser.newPage();

    // 禁用 WebRTC
    await outlookCreate.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webRTCEnabled', { get: () => false });
    });
    //模拟浏览器环境
    await outlookCreate.emulate({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
    });

    await outlookCreate.evaluateOnNewDocument(() => {
      // 随机化时区和语言
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'timeZone', { get: () => 'America/New_York' });

      // 修改 WebGL 指纹
      const _webglRenderingEngine = window.WebGLRenderingContext.prototype.getShaderPrecisionFormat;
      window.WebGLRenderingContext.prototype.getShaderPrecisionFormat = function () {
        // 这里可以添加一些随机性
        return _webglRenderingEngine.apply(this, arguments);
      };
    });

    await outlookCreate.evaluateOnNewDocument(() => {
      // 修改 navigator.plugins
      navigator.__proto__.plugins = [
        { name: 'Plugin 1', filename: 'plugin1.dll' },
        { name: 'Plugin 2', filename: 'plugin2.dll' }
      ];

      // 确保 navigator.webdriver 为 false
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';
    await outlookCreate.setUserAgent(userAgent);

    await outlookCreate.goto(config.RegisteredAddress[0]);
    if (await outlookCreate.$('#iSignupAction')) {
      await outlookCreate.locator("#iSignupAction").click();
    } else {
      await outlookCreate.locator("#nextButton").click();
    }
    await outlookCreate.locator('#liveSwitch').click();
    await outlookCreate.locator('#usernameInput').click();
    await outlookCreate.type('#usernameInput', username);
    // await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000)));
    await outlookCreate.locator('#nextButton').click();
    // await outlookCreate.locator('#iSignupAction').click();
    await outlookCreate.locator('#PasswordInput').click();
    await outlookCreate.type('#PasswordInput', passWord);
    // await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000)));
    await outlookCreate.locator('#iSignupAction').click();
    await outlookCreate.locator('#LastName').click();

    await outlookCreate.type('#LastName', lastName);
    // await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000)));
    await outlookCreate.locator('#FirstName').click();

    await outlookCreate.type('#FirstName', firstName);
    // await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000)));
    await outlookCreate.locator('#iSignupAction').click();
    // await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000)));
    await outlookCreate.locator('#Country').click();

    await outlookCreate.select('#Country', 'CN');
    await outlookCreate.locator('#BirthYear').click();
    await outlookCreate.type('#BirthYear', String(year));
    await outlookCreate.locator('#BirthMonth').click();
    await outlookCreate.select('#BirthMonth', String(month));
    await outlookCreate.locator('#BirthDay').click();
    await outlookCreate.select('#BirthDay', String(day));
    await outlookCreate.locator('#iSignupAction').click();

    // await outlookCreate.locator('#BirthYear').click();
    // await outlookCreate.locator('#iSignupAction').click();
    //在页面上下文中执行 fetch 请求
    // const taskIdPromise = outlookCreate.evaluate(() => {
    //   return fetch('https://api.yescaptcha.com/createTask', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       "clientKey": "e678ad2cf192dd1d6579203b115ee092f506e2f337866",
    //       "task":
    //       {
    //         "type": "TurnstileTaskProxyless",
    //         "websiteURL": "https://platform.deepseek.com/sign_up",
    //         "websiteKey": "0x4AAAAAAAWyVgVmIhS-Imzy"
    //       }
    //     }),
    //   }).then(response => response.json());
    // });

    // 等待请求完成并获取响应数据
    // const taskId = (await taskIdPromise).taskId;

    // console.log('taskId: ' + taskId);

    // await new Promise(resolve => setTimeout(resolve, randomDelay(10000, 80000))); // 随机延迟 10-80 秒

    // const turnstilePromise = outlookCreate.evaluate(([taskId]) => {
    //   return fetch('https://api.yescaptcha.com/getTaskResult', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       "clientKey": "e678ad2cf192dd1d6579203b115ee092f506e2f337866",
    //       taskId
    //     }),
    //   }).then(response => response.json());
    // }, [taskId]);

    // const turnstile_token = (await turnstilePromise).solution.token;

    // console.log('turnstile_token: ' + turnstile_token);

    // const sendMailPromise = outlookCreate.evaluate(([turnstile_token, mailValue]) => {
    //   return fetch('https://platform.deepseek.com/auth-api/v0/users/create_email_verification_code', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       "email": mailValue,
    //       turnstile_token,
    //       "locale": "en_US"
    //     }),
    //   }).then(response => response.json());
    // }, [turnstile_token, mailValue]);

    // const sendMailData = await sendMailPromise;

    // console.log(sendMailData);

    // console.log("回到邮件页面");
    // await bringPageToFront(browser, 1);
    // await tempMailPage.waitForSelector('#maillist > tr');

    // console.log("点击获取到的邮件");
    // await tempMailPage.click("#maillist > tr");

    // console.log("获取验证码");
    // const codeValue = await tempMailPage.$eval('#mailcard > div:nth-child(2) > div > div:nth-child(6) > table > tbody > tr > td > div > table > tbody > tr > td > table > tbody > tr > td > div', element => element.textContent);
    // console.log("验证码为: " + codeValue);

    // const registerPromise = outlookCreate.evaluate(([mailValue, codeValue, passWord]) => {
    //   return fetch('https://platform.deepseek.com/auth-api/v0/users/register', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       "locale": "zh_CN",
    //       "region": "TW",
    //       "payload": {
    //         "email": mailValue,
    //         "email_verification_code": codeValue,
    //         "password": passWord
    //       }
    //     }),
    //   }).then(response => response.json());
    // }, [mailValue, codeValue, passWord]);

    // const registerToken = (await registerPromise).data.user.token;

    // console.log(registerToken);

    // const getKeyPromise = outlookCreate.evaluate(([registerToken]) => {
    //   return fetch('https://platform.deepseek.com/api/v0/users/edit_api_keys', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': 'Bearer ' + registerToken,
    //     },
    //     body: JSON.stringify({
    //       "action": "create",
    //       "name": "testapi",
    //       "redacted_key": null,
    //       "created_at": null
    //     }),
    //   }).then(response => response.json());
    // }, [registerToken]);

    // const sensitive_id = (await getKeyPromise).data.api_key.sensitive_id;

    // const time = generateDateRange()

    // console.log("创建完成");
    // console.log("账号:" + mailValue);
    // console.log("密码:" + passWord);
    // console.log("Key:" + sensitive_id);
    // console.log("有效期:" + time);
    // return {
    //   u: mailValue,
    //   p: passWord,
    //   k: sensitive_id,
    //   t: time
    // }
  } catch (error) {
    console.error("发生错误: " + error);
  } finally {
    // if (browser) {
    //   await browser.close();
    // }
  }
}
async function generateRandomPassword(charset, length) {
  let passWord = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    passWord += charset[randomIndex];
  }
  return passWord;
}
async function goGet(num) {
  if (!num) {
    getSingleAccount();
  } else {
    await getMultipleAccounts(num);
  }
}

async function getSingleAccount() {
  const account = await getAccount();
  if (account) {
    fs.writeFileSync("./chatgptAccount.txt", JSON.stringify(account) + '\n', { flag: 'a' });
    // console.log("创建成功, 共计 1 个");
  }

  if (!account) {
    // console.log("创建失败, 共计 1 个");
  }

}

async function getMultipleAccounts(num) {
  let successAccountCount = 0;
  let errorAccountCount = 0;
  while (true) {
    const account = await getAccount();
    if (account) {
      fs.writeFileSync("./chatgptAccount.txt", JSON.stringify(account) + '\n', { flag: 'a' });
      successAccountCount++;
    }

    if (!account) {
      errorAccountCount++
    }

    num--;
  }

  // console.log("创建完成, 共计 " + num + " 个\n");
  // console.log("成功 " + successAccountCount + " 个\n");
  // console.log("失败" + errorAccountCount + " 个\n");
}

goGet(num);