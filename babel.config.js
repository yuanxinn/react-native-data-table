// 仅供 Jest（react-native preset）转译 TS/TSX 使用；库构建走 tsc，不经过 Babel
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
