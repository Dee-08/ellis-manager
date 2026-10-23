export const contact = {
  email: "hubanimalia@gmail.com",
  phones: ["+2347032522952", "+25562476243", "+919010077077", "+2348073223754"],
  address:
    "Upper Floor, Musarchy Flats, Harmony Estate, Alabata, Camp, Abeokuta, Nigeria.",
};
export const displayPhone = (n) =>
  ({
    "+2347032522952": "+234 703 252 2952",
    "+25562476243": "+255 624 762 43",
    "+919010077077": "+91 90100 77077",
    "+2348073223754": "+234 807 322 3754",
  })[n] || n;
