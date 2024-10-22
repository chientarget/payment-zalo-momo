require('dotenv').config();
const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const moment = require('moment');
const express = require('express');
const bodyParser = require('body-parser');
const qs = require('qs');
const path = require('path');
const app = express();

const config = {
  app_id: process.env.ZALOPAY_APP_ID,
  key1: process.env.ZALOPAY_KEY1,
  key2: process.env.ZALOPAY_KEY2,
  key3: process.env.ZALOPAY_KEY3,
};

app.use(bodyParser.json());

app.post('/payment', async (req, res) => {
  try {
    // Validate required fields from request body
    const requiredFields = ['user_id', 'amount', 'description', 'title'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `Missing required field: ${field}`,
        });
      }
    }

    const transID = Math.floor(Math.random() * 1000000);

    // Get data from request body with defaults
    const embed_data = {
      redirecturl: process.env.REDIRECT_URL,
      ...req.body.embed_data,
    };

    const items = req.body.items || [{}];

    const order = {
      app_id: config.app_id,
      app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
      app_user: req.body.user_id,
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      callback_url: process.env.CALLBACK_URL,
      amount: parseInt(req.body.amount),
      description: req.body.description || `Thanh toán gói Premium #${transID}`,
      bank_code: req.body.bank_code || '',// Allow bank_code to be empty
      title: req.body.title || '',
    };

    // Create mac signature
    const data = config.app_id + '|' +
      order.app_trans_id + '|' +
      order.app_user + '|' +
      order.amount + '|' +
      order.app_time + '|' +
      order.embed_data + '|' +
      order.item;

    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    const response = await axios.post(process.env.ZALOPAY_CREATE_URL, null, {
      params: order,
    });

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

app.all('/callback', (req, res) => {
  let result = {};

  try {
    // Xử lý yêu cầu GET hoặc POST
    let dataStr = req.body.data || req.query.data; // Kiểm tra cả body và query string
    let reqMac = req.body.mac || req.query.mac;

    // Tính toán lại MAC từ dữ liệu nhận được và key2
    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    console.log('mac =', mac);

    // Kiểm tra MAC có hợp lệ không
    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = 'mac not equal';
      console.log('MAC not valid.');
    } else {
      // Xử lý thanh toán thành công
      let dataJson = JSON.parse(dataStr);
      console.log('Payment successful for transaction id =', dataJson['app_trans_id']);

      result.return_code = 1;
      result.return_message = 'success';
    }
  } catch (ex) {
    result.return_code = 0; // ZaloPay sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
    console.error('Error during callback processing:', ex.message);
  }

  // Trả về kết quả cho ZaloPay
  res.json(result);
});

app.post('/check-status-order', async (req, res) => {
  const { app_trans_id } = req.body;

  let postData = {
    app_id: config.app_id,
    app_trans_id,
  };

  let data = postData.app_id + '|' + postData.app_trans_id + '|' + config.key1; // appid|app_trans_id|key1
  postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  let postConfig = {
    method: 'post',
    url: process.env.ZALOPAY_QUERY_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify(postData),
  };

  try {
    const result = await axios(postConfig);
    console.log(result.data);
    return res.status(200).json(result.data);
  } catch (error) {
    console.log('lỗi ohhhhh');
    console.log(error);
  }
});

// app.listen(process.env.PORT, function() {
//   console.log(`Server is listening at port :${process.env.PORT}`);
// });
