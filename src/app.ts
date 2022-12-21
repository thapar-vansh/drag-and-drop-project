// Project type
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
//project state management
type Listener<T> = (items: T[]) => void

class State<T> {
  protected listeners: Listener<T>[] = []
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn)
  }
}
class ProjectState extends State<Project> {
  private projects: Project[] = []

  private static instance: ProjectState
  private constructor() {
    super()
  }
  static getInstance() {
    if (this.instance) {
      return this.instance
    }
    return (this.instance = new ProjectState())
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

// base component class
// generic class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement
  hostElement: T
  element: U

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = <HTMLTemplateElement>(
      document.getElementById(templateId)!
    ) // typecasting
    this.hostElement = <T>document.getElementById(hostElementId)!

    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = <U>importedNode.firstElementChild // typecasting
    if (newElementId) {
      this.element.id = newElementId
    }
    this.attach(insertAtStart)
  }
  private attach(insertAtBeginning: Boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? 'afterbegin' : 'beforeend',
      this.element
    )
  }
  abstract configure(): void
  abstract renderContent(): void
}

// Project item class to render single item

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
  private project: Project
  constructor(hostId: string, project: Project) {
    super('single-project', hostId, false, project.id) // false to render item at end
    this.project = project
    this.configure()
    this.renderContent()
  }
  configure(): void {}
  renderContent(): void {
    this.element.querySelector('h2')!.textContent = this.project.title
    this.element.querySelector('h3')!.textContent =
      this.project.people.toString()
    this.element.querySelector('p')!.textContent = this.project.description
  }
}

// Project list class

class ProjectList extends Component<HTMLDivElement, HTMLElement> {
  assignedProjects: Project[]
  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`)
    this.assignedProjects = []
    this.configure()
    this.renderContent()
  }
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement
    listEl.innerHTML = '' //to eliminate repetion on adding projects
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector('ul')!.id, prjItem)
    }
  }
  configure(): void {
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
  }
  renderContent() {
    const listId = `${this.type}-projects-list`
    this.element.querySelector('ul')!.id = listId
    this.element.querySelector('h2')!.textContent =
      `${this.type}`.toUpperCase() + ' Projects'
  }
}

//Project input class

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement
  descriptionInputElement: HTMLInputElement
  peopleInputElement: HTMLInputElement

  constructor() {
    super('project-input', 'app', true, 'user-input')
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
  }
  configure() {
    this.element.addEventListener('submit', this.submitHandler)
  }
  renderContent(): void {}
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
}

const prjInput = new ProjectInput()
const activePrjList = new ProjectList('active')
const finsihedPrjList = new ProjectList('finished')
