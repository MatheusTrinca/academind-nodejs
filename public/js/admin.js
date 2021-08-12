const deleteProduct = async btn => {
  const productId = btn.parentNode.querySelector('[name=productId]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const productElement = btn.closest('article');

  try {
    await fetch(`/admin/product/${productId}`, {
      method: 'DELETE',
      headers: {
        'csrf-token': csrfToken,
      },
    });
    productElement.parentNode.removeChild(productElement);
  } catch (err) {
    console.log(err);
  }
};
