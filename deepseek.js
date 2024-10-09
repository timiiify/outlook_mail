const fs = require('fs');
const puppeteer = require('puppeteer-extra');
//截取node main.js 10中的10，用来循环运行
const args = process.argv.slice(2);
const num = args[0] ? Number(args[0]) : null;
// 创建配置文件
const config = {
  RegisteredAddress: [
    'https://platform.deepseek.com/sign_up'
  ],
  MailAddress: "https://ihotmails.com/", // 注册邮箱地址，Google搜索Forsaken Mail临时邮箱，默认使用https://ihotmails.com/
  headless: false, // 是否开启浏览器无头模式，为false时为关闭，有问题时可以改为false做调试，查看问题原因
}
let puppeteerConfig = {
  headless: config.headless,
  ignoreHTTPSErrors: true,
  args: [
    '--disable-blink-features=AutomationControlled'
  ],
}

const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

async function getAccount() {

  let browser;
  try {
    browser = await puppeteer.launch(puppeteerConfig);
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let passWord = await generateRandomPassword(charset, 20);

    console.log("生成随机密码: " + passWord);

    console.log("打开临时邮箱页面");
    const tempMailPage = await browser.newPage();
    await tempMailPage.goto(config.MailAddress);
    await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000))); // 随机延迟 1-3 秒

    const mailValue = await getValueFromSelector(tempMailPage, '#shortid');
    if (!mailValue) {
      console.log("邮箱获取失败，关闭浏览器");
      await browser.close();
      return;
    }
    console.log("邮箱获取成功，邮箱的值为" + mailValue);

    console.log("打开ChatGPT注册页面");
    const chatGPTPage = await browser.newPage();

    // 禁用 WebRTC
    await chatGPTPage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webRTCEnabled', { get: () => false });
    });
    await chatGPTPage.emulate({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
    });

    await chatGPTPage.evaluateOnNewDocument(() => {
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

    await chatGPTPage.evaluateOnNewDocument(() => {
      // 修改 navigator.plugins
      navigator.__proto__.plugins = [
        { name: 'Plugin 1', filename: 'plugin1.dll' },
        { name: 'Plugin 2', filename: 'plugin2.dll' }
      ];

      // 确保 navigator.webdriver 为 false
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';
    await chatGPTPage.setUserAgent(userAgent);

    await chatGPTPage.goto(config.RegisteredAddress[0]);
    await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000))); // 随机延迟 1-3 秒

    // 0x4AAAAAAAWyVgVmIhS-Imzy

    // 在页面上下文中执行 fetch 请求
    const taskIdPromise = chatGPTPage.evaluate(() => {
      return fetch('https://api.yescaptcha.com/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "clientKey": "e678ad2cf192dd1d6579203b115ee092f506e2f337866",
          "task":
          {
            "type": "TurnstileTaskProxyless",
            "websiteURL": "https://platform.deepseek.com/sign_up",
            "websiteKey": "0x4AAAAAAAWyVgVmIhS-Imzy"
          }
        }),
      }).then(response => response.json());
    });

    // 等待请求完成并获取响应数据
    const taskId = (await taskIdPromise).taskId;

    console.log('taskId: ' + taskId);

    await new Promise(resolve => setTimeout(resolve, randomDelay(10000, 80000))); // 随机延迟 10-80 秒

    const turnstilePromise = chatGPTPage.evaluate(([taskId]) => {
      return fetch('https://api.yescaptcha.com/getTaskResult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "clientKey": "e678ad2cf192dd1d6579203b115ee092f506e2f337866",
          taskId
        }),
      }).then(response => response.json());
    }, [taskId]);

    const turnstile_token = (await turnstilePromise).solution.token;

    console.log('turnstile_token: ' + turnstile_token);

    const sendMailPromise = chatGPTPage.evaluate(([turnstile_token, mailValue]) => {
      return fetch('https://platform.deepseek.com/auth-api/v0/users/create_email_verification_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "email": mailValue,
          turnstile_token,
          "locale": "en_US"
        }),
      }).then(response => response.json());
    }, [turnstile_token, mailValue]);

    const sendMailData = await sendMailPromise;

    console.log(sendMailData);

    console.log("回到邮件页面");
    await bringPageToFront(browser, 1);
    await tempMailPage.waitForSelector('#maillist > tr');

    console.log("点击获取到的邮件");
    await tempMailPage.click("#maillist > tr");

    console.log("获取验证码");
    const codeValue = await tempMailPage.$eval('#mailcard > div:nth-child(2) > div > div:nth-child(6) > table > tbody > tr > td > div > table > tbody > tr > td > table > tbody > tr > td > div', element => element.textContent);
    console.log("验证码为: " + codeValue);

    const registerPromise = chatGPTPage.evaluate(([mailValue, codeValue, passWord]) => {
      return fetch('https://platform.deepseek.com/auth-api/v0/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "locale": "zh_CN",
          "region": "TW",
          "payload": {
            "email": mailValue,
            "email_verification_code": codeValue,
            "password": passWord
          }
        }),
      }).then(response => response.json());
    }, [mailValue, codeValue, passWord]);

    const registerToken = (await registerPromise).data.user.token;

    console.log(registerToken);

    const getKeyPromise = chatGPTPage.evaluate(([registerToken]) => {
      return fetch('https://platform.deepseek.com/api/v0/users/edit_api_keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + registerToken,
        },
        body: JSON.stringify({
          "action": "create",
          "name": "testapi",
          "redacted_key": null,
          "created_at": null
        }),
      }).then(response => response.json());
    }, [registerToken]);

    const sensitive_id = (await getKeyPromise).data.api_key.sensitive_id;

    const time = generateDateRange()

    console.log("创建完成");
    console.log("账号:" + mailValue);
    console.log("密码:" + passWord);
    console.log("Key:" + sensitive_id);
    console.log("有效期:" + time);
    return {
      u: mailValue,
      p: passWord,
      k: sensitive_id,
      t: time
    }
  } catch (error) {
    console.error("发生错误: " + error);
  } finally {
    if (browser) {
      await browser.close();
    }
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

async function getValueFromSelector(page, selector) {
  return await page.evaluate((selector) => {
    const inputElement = document.querySelector(selector);
    return inputElement ? inputElement.value : null;
  }, selector);
}

async function bringPageToFront(browser, index) {
  const allPages = await browser.pages();
  if (index < allPages.length) {
    await allPages[index].bringToFront();
  }
}

function generateDateRange() {
  // 获取当前时间
  const currentDate = new Date();

  // 设置未来五天的时间
  const futureDate = new Date();
  futureDate.setDate(currentDate.getDate() + 5);

  // 格式化日期为字符串
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 生成日期范围字符串
  const startDate = formatDate(currentDate);
  const endDate = formatDate(futureDate);
  return `${startDate} - ${endDate}`;
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
    console.log("创建成功, 共计 1 个");
  }

  if (!account) {
    console.log("创建失败, 共计 1 个");
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

  console.log("创建完成, 共计 " + num + " 个\n");
  console.log("成功 " + successAccountCount + " 个\n");
  console.log("失败" + errorAccountCount + " 个\n");
}

goGet(num);