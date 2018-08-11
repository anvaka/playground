
export default function format(num) {
  if (typeof num !== 'string') num = num.toString()

  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

