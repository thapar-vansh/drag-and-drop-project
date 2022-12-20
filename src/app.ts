// Project state management
enum ProjectStatus {
  Active,
  Finsihed,
}
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

type Listener = (items: Project[]) => void
class ProjectState {
  private projects: Project[] = []
  private listeners: Listener[] = []

  private static instance: ProjectState
  constructor() {}
  static getInstance() {
    if (this.instance) {
      return this.instance
    }
    return (this.instance = new ProjectState())
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn)
  }
  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    )
    this.projects.push(newProject)
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice())
    }
  }
}

// creates only a single insta
const projectState = ProjectState.getInstance()

//validatation

interface Validatable {
  value: string | number
  required?: boolean
  minlength?: number
  maxLength?: number
  min?: number
  max?: number
}

function validate(validatableInput: Validatable) {
  let isValid = true
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0
  }
  if (
    validatableInput.minlength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minlength
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max
  }
  return isValid
}
//autobind decorator

function autobind(
  _: any, // hint to ts that we'll not use this //target
  _2: string, //methodname
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this)
      return boundFn
    },
  }
  return adjDescriptor
}

// Project list class

class ProjectList {
  templateElement: HTMLTemplateElement
  hostElement: HTMLDivElement
  element: HTMLElement
  assignedProjects: Project[]
  constructor(private type: 'active' | 'finished') {
    this.templateElement = <HTMLTemplateElement>(
      document.getElementById('project-list')!
    ) // typecasting
    this.hostElement = <HTMLDivElement>document.getElementById('app')!
    this.assignedProjects = []

    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = <HTMLElement>importedNode.firstElementChild // typecasting
    this.element.id = `${this.type}-projects`

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if (this.type == 'active') {
          return prj.status === ProjectStatus.Active
        }
        return prj.status === ProjectStatus.Finsihed
      })
      this.assignedProjects = relevantProjects
      this.renderProjects()
    })

    this.attach()
    this.renderContent()
  }
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement
    listEl.innerHTML = '' //to eliminate repetion on adding projects
    for (const prjItem of this.assignedProjects) {
      const listItem = document.createElement('li')
      listItem.textContent = prjItem.title
      listEl.appendChild(listItem)
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`
    this.element.querySelector('ul')!.id = listId
    this.element.querySelector('h2')!.textContent =
      `${this.type}`.toUpperCase() + ' Projects'
  }
  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element)
  }
}

//Project input class

class ProjectInput {
  templateElement: HTMLTemplateElement
  hostElement: HTMLDivElement
  element: HTMLFormElement
  titleInputElement: HTMLInputElement
  descriptionInputElement: HTMLInputElement
  peopleInputElement: HTMLInputElement

  constructor() {
    this.templateElement = <HTMLTemplateElement>(
      document.getElementById('project-input')!
    ) // typecasting
    this.hostElement = <HTMLDivElement>document.getElementById('app')!

    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = <HTMLFormElement>importedNode.firstElementChild // typecasting
    this.element.id = 'user-input'
    this.titleInputElement = this.element.querySelector(
      '#title'
    ) as HTMLInputElement
    this.descriptionInputElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement
    this.peopleInputElement = this.element.querySelector(
      '#people'
    ) as HTMLInputElement
    this.configure()
    this.attach()
  }

  private gatherUserInput(): [string, string, number] | void {
    let enteredTitle = this.titleInputElement.value
    let enteredDescription = this.descriptionInputElement.value
    let enteredPeople = this.peopleInputElement.value

    const validatableTitle: Validatable = {
      value: enteredTitle,
      required: true,
    }
    const validatableDesc: Validatable = {
      value: enteredDescription,
      required: true,
      minlength: 5,
    }
    const validatablePeople: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5,
    }
    if (
      !validate(validatableTitle) ||
      !validate(validatableDesc) ||
      !validate(validatablePeople)
    ) {
      alert('NO INPUT RECIEVED OR NOT ALL FIELDS FILLED')
      return
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople]
    }
  }

  private clearInput() {
    this.titleInputElement.value = ''
    this.descriptionInputElement.value = ''
    this.peopleInputElement.value = ''
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault()
    const userInput = this.gatherUserInput()
    if (Array.isArray(userInput)) {
      // to check if it is an array/tuple
      const [title, desc, people] = userInput // destructing the input recieved in array form
      projectState.addProject(title, desc, people)
      this.clearInput()
    }
  }
  private configure() {
    this.element.addEventListener('submit', this.submitHandler)
  }
  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element)
  }
}

const prjInput = new ProjectInput()
const activePrjList = new ProjectList('active')
const finsihedPrjList = new ProjectList('finished')
