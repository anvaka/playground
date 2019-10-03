export function getHumanFriendlyTimeSinceCreation(band) {
  const minutes = band * 5;
  const hours = Math.floor(minutes / 60);
  const minutesInHour = minutes - hours * 60;
  return hours ? `${hours}h ${minutesInHour}m` : `${minutesInHour}m`;
}
