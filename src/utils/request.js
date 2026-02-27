import { API_BASE_URL } from '../config/app.js'

// 请求拦截器
const request = (options) => {
  return new Promise((resolve, reject) => {
    let loadingShown = false
    
    // 显示加载提示
    if (options.loading !== false) {
      try {
        uni.showLoading({
          title: '加载中...',
          mask: true
        })
        loadingShown = true
      } catch (e) {
        console.warn('showLoading failed:', e)
      }
    }

    // 隐藏loading的安全方法
    const safeHideLoading = () => {
      if (loadingShown) {
        try {
          uni.hideLoading()
          loadingShown = false
        } catch (e) {
          console.warn('hideLoading failed:', e)
        }
      }
    }

    // 获取token
    const token = uni.getStorageSync('token')
    
    uni.request({
      url: API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'token': token || '',
        ...options.header
      },
      success: (res) => {
        // 隐藏加载提示
        safeHideLoading()

        if (res.statusCode === 200) {
          // 请求成功
          if (res.data.code === 200) {
            resolve(res.data)
          } else {
            // 业务错误
            uni.showToast({
              title: res.data.message || res.data.msg || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除token并跳转登录
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          reject(res)
        } else {
          // HTTP错误
          uni.showToast({
            title: `请求失败 ${res.statusCode}`,
            icon: 'none'
          })
          reject(res)
        }
      },
      fail: (err) => {
        // 隐藏加载提示
        safeHideLoading()
        
        uni.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// GET请求
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

// POST请求
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

// PUT请求
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

// DELETE请求
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

export {
  request,
  get,
  post,
  put,
  del
}
