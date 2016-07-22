'use strict';

function getFormattedTags(tags) {
  return tags.map((tag) => {
    if (tag.includes("-")) {
      let [barcode,count] = tag.split("-");
      return {barcode, count: parseInt(count)}
    } else {
      return {barcode: tag, count: 1}
    }
  })
}
function getBarcode(array, barcode) {
  return array.find((element) =>element.barcode === barcode);
}
function getCountBarcodes(formattedTags) {
  return formattedTags.reduce((result, formattedTag) => {
    let found = getBarcode(result, formattedTag.barcode)
    if (found) {
      found.count += formattedTag.count;
    } else {
      result.push(formattedTag);
    }
    return result;
  }, [])
}

function buildCartItems(formattedTages, allItems) {
  return formattedTages.map(({barcode, count}) => {
    let {name, unit, price} = getBarcode(allItems, barcode);
    return {barcode, name, unit, price, count}
  });
}
function fixed(number) {
  return parseFloat(number.toFixed(2));
}
function buildPromotionItems(cartItems, promotions) {
  let currentPromotion = promotions.find((promotion) => promotion.type === '单品批发价出售');
  return cartItems.map((cartItem) => {
    let hasPromotion = currentPromotion.barcodes.includes(cartItem.barcode) && cartItem.count > 10;
    let price = cartItem.count * cartItem.price;
    let saved = hasPromotion ? price * 0.05 : 0;
    let payPrice = price - saved;
    return Object.assign({}, cartItem, {
      payPrice, saved: fixed(saved)
    });
  });
}

function calculateTotalPrices(promotionItems) {
  return promotionItems.reduce((result, {payPrice, saved}) => {
    result.totalPayPrice += payPrice;
    result.totalSaved += saved
    return result;
  }, {totalPayPrice: 0, totalSaved: 0})
}

function buildReceipt(promotionItem, {totalPayPrice, totalSaved}) {
  let promotedItems = [];
  let savedItems = [];
  for (let element of promotionItem) {
    promotedItems.push({
      name: element.name,
      unit: element.unit,
      price: element.price,
      count: element.count,
      payPrice: element.payPrice,
      saved: element.saved
    });
    if (element.saved !== 0) {
      savedItems.push({
        name: element.name,
        count: element.count,
        unit: element.unit
      });
    }
  }
  return {
    promotedItems,
    savedItems,
    totalPayPrice,
    totalSaved
  }
}

function buildReceiptString(receipt) {
  let lines = ['***<没钱赚商店>购物清单***'];
  for (let {name, count, unit, price, payPrice, saved} of receipt.promotedItems) {
    let line = `名称：${name}，数量：${count}${unit}，单价：${price.toFixed(2)}(元)，小计：${payPrice.toFixed(2)}(元)`;
    if (saved > 0) {
      line += `，优惠：${saved.toFixed(2)}(元)`;
    }
    lines.push(line);
  }

  let hasPromoted = receipt.savedItems.length > 0;
  if (hasPromoted) {
    lines.push('----------------------');
    lines.push('批发价出售商品：');
  }
  for (let {name, count, unit} of receipt.savedItems) {
    let promotedLine = `名称：${name}，数量：${count}${unit}`;
    lines.push(promotedLine);
  }
  lines.push('----------------------');
  lines.push(`总计：${receipt.totalPayPrice.toFixed(2)}(元)`);
  if (hasPromoted) {
    lines.push(`节省：${receipt.totalSaved.toFixed(2)}(元)`);
  }
  lines.push('**********************');

  let receiptString = lines.join('\n');
  console.log(receiptString);
}

function printReceipt(tags) {
  let formattedTags = getFormattedTags(tags);
  let countedBarcodes = getCountBarcodes(formattedTags);
  let allItems = loadAllItems();
  let cartItems = buildCartItems(countedBarcodes, allItems);
  let promotions = loadPromotions();
  let promotionItems = buildPromotionItems(cartItems, promotions);
  let totalPrice = calculateTotalPrices(promotionItems);
  let receipt = buildReceipt(promotionItems, totalPrice);
  let receiptString = buildReceiptString(receipt);
  // console.log(receiptString);
}









