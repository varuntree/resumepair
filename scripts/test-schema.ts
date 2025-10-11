import { ResumeGenerativeSchema } from '../libs/validation/resume'

// Test 1: Empty object
console.log('Test 1: Empty object')
const test1 = ResumeGenerativeSchema.safeParse({})
console.log('Success:', test1.success)
if (!test1.success) {
  console.log('Errors:', JSON.stringify(test1.error.errors, null, 2))
}

// Test 2: Only profile with partial data
console.log('\nTest 2: Only profile with partial data')
const test2 = ResumeGenerativeSchema.safeParse({
  profile: {
    fullName: 'John Doe'
  }
})
console.log('Success:', test2.success)
if (!test2.success) {
  console.log('Errors:', JSON.stringify(test2.error.errors, null, 2))
}

// Test 3: Profile with work experience
console.log('\nTest 3: Profile with work experience')
const test3 = ResumeGenerativeSchema.safeParse({
  profile: {
    fullName: 'Jane Smith',
    email: 'jane@example.com'
  },
  work: [{
    company: 'Acme Corp',
    role: 'Developer'
  }]
})
console.log('Success:', test3.success)
if (!test3.success) {
  console.log('Errors:', JSON.stringify(test3.error.errors, null, 2))
}

// Test 4: Complete resume
console.log('\nTest 4: Complete resume')
const test4 = ResumeGenerativeSchema.safeParse({
  profile: {
    fullName: 'Bob Jones',
    email: 'bob@example.com',
    phone: '555-1234'
  },
  summary: 'Experienced software engineer',
  work: [{
    company: 'Tech Co',
    role: 'Senior Developer',
    startDate: '2020-01',
    descriptionBullets: ['Built features', 'Fixed bugs']
  }],
  education: [{
    school: 'University',
    degree: 'BS Computer Science'
  }],
  skills: [{
    category: 'Programming',
    items: ['JavaScript', 'Python']
  }]
})
console.log('Success:', test4.success)
if (!test4.success) {
  console.log('Errors:', JSON.stringify(test4.error.errors, null, 2))
}
