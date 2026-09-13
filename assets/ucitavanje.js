(function () {
  const zastor = document.getElementById('ucitavanje');
  if (!zastor) return;

  const koren = document.documentElement;
  koren.classList.add('ucitava');

  let sakriven = false;

  function sakrij() {
    if (sakriven) return;
    sakriven = true;
    zastor.classList.add('gotovo');
    koren.classList.remove('ucitava');
    setTimeout(() => { zastor.style.display = 'none'; }, 700);
  }

  if (document.readyState === 'complete') setTimeout(sakrij, 400);
  else addEventListener('load', () => setTimeout(sakrij, 400));

  setTimeout(sakrij, 8000);
})();
