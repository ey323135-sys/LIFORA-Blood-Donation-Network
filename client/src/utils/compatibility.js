export const COMPATIBILITY_RULES = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

export function canDonateTo(donorGroup, recipientGroup) {
  if (!donorGroup || !recipientGroup) return false;
  return COMPATIBILITY_RULES[donorGroup]?.includes(recipientGroup) || false;
}

export function getCompatibleDonorTypes(recipientGroup) {
  return Object.keys(COMPATIBILITY_RULES).filter(donor => 
    COMPATIBILITY_RULES[donor].includes(recipientGroup)
  );
}
