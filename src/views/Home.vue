<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Secure storage</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :scroll-y="true"
    >
      <div class="flex flex-col justify-start items-center w-full ion-padding-top pr-5 space-y-4">
        <ion-item
          v-if="!Capacitor.isNative"
          lines="inset"
          class="w-full"
        >
          <ion-label position="stacked">
            Storage
          </ion-label>
          <ion-select
            v-model="storageType"
            interface="action-sheet"
            :interface-options="{ header: 'Select storage type' }"
            class="flex-initial max-w-full"
          >
            <ion-select-option value="sessionStorage">
              sessionStorage
            </ion-select-option>

            <ion-select-option value="localStorage">
              localStorage
            </ion-select-option>
          </ion-select>
        </ion-item>

        <div class="flex items-end w-full">
          <ion-item
            lines="inset"
            class="w-full"
          >
            <ion-label position="stacked">
              Prefix
            </ion-label>

            <ion-input
              v-model="prefix"
              type="text"
              class="flex-1"
            />
          </ion-item>

          <ion-button
            size="small"
            class="flex-initial"
            @click="onSetPrefix"
          >
            Set
          </ion-button>
          <ion-button
            size="small"
            class="flex-initial ml-1"
            @click="onShowKeys"
          >
            Keys
          </ion-button>
        </div>


        <ion-item
          lines="inset"
          class="w-full"
        >
          <ion-label position="stacked">
            Key
          </ion-label>
          <ion-input
            v-model="key"
            type="text"
            required
          />
        </ion-item>

        <ion-item
          lines="inset"
          class="w-full"
        >
          <ion-label position="stacked">
            Data {{ dataType ? `(${dataType})` : '' }}
          </ion-label>
          <ion-input
            v-model="data"
            required
            @ionChange="onDataChanged"
          />
        </ion-item>
      </div>
      <div class="flex justify-center items-center w-full mt-6 space-x-4">
        <ion-button @click="onSet">
          Set
        </ion-button>

        <ion-button @click="onGet">
          Get
        </ion-button>

        <ion-button @click="onRemove">
          Rm
        </ion-button>

        <ion-button @click="onClear">
          Clear
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  alertController,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { Capacitor, Plugins } from '@capacitor/core'
import {
  DataType,
  StorageError,
  StorageType,
  WSSecureStoragePlugin
} from '@aparajita/capacitor-secure-storage'
import { defineComponent, onBeforeMount, ref, watch } from 'vue'

let storage: WSSecureStoragePlugin

export default defineComponent({
  name: 'Home',

  components: {
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
  },

  setup() {
    /*
     * ref
     */
    const key = ref('')
    const data = ref('')
    const dataType = ref('')
    const storageType = ref(StorageType[StorageType.localStorage])
    const prefix = ref('')

    /*
     * watch
     */
    watch(storageType, () => onChangeStorageType())

    /*
     * lifecycle
     */
    onBeforeMount(() => {
      storage = Plugins.WSSecureStorage as WSSecureStoragePlugin
      prefix.value = storage.keyPrefix

      // This stuff pertains only to the web
      if (!Capacitor.isNative) {
        let key = process?.env?.WS_SECURE_STORAGE_KEY

        if (!key) {
          console.warn(
            'The encryption key should be set by the environment variable WS_SECURE_STORAGE_KEY or by calling setEncryptionKey()'
          )
          key = 'This is just a placeholder'
        }

        storage.setEncryptionKey(key)
      }
    })

    /*
     * methods
     */
    function onChangeStorageType() {
      storage.storageType =
        storageType.value === 'sessionStorage'
          ? StorageType.sessionStorage
          : StorageType.localStorage
    }

    function onDataChanged(event: CustomEvent) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, type] = parseValue(event.detail.value)
        dataType.value = type
      } catch (e) {
        dataType.value = ''
      }
    }

    async function onSet() {
      try {
        const [value, type] = parseValue(data.value)
        await storage.set(key.value, value)
        await showAlert(`Item (${type}) stored successfully.`)
        data.value = ''
        dataType.value = ''
      } catch (e) {
        await showErrorAlert(e)
      }
    }

    function parseValue(value: string): [DataType, string] {
      if (!value) {
        throw new SyntaxError('Empty data value')
      }

      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        const date = new Date(value)

        // If the format is not a valid date, the properties will be NaN
        if (!Number.isNaN(date.getFullYear())) {
          return [date, 'date']
        }
      }

      const parsed = JSON.parse(value)
      let type: string = typeof parsed

      if (type === 'object') {
        if (parsed === null) {
          type = 'null'
        } else if (Array.isArray(parsed)) {
          type = 'array'
        }
      }

      return [parsed, type]
    }

    function getDataType(value: DataType) {
      let type = typeof value

      if (type === 'object') {
        if (value === null) {
          return 'null'
        }

        if (value instanceof Date) {
          return 'date'
        }

        if (Array.isArray(value)) {
          return 'array'
        }

        return 'object'
      }

      return type
    }

    async function onGet() {
      try {
        const value = await storage.get(key.value)

        if (value instanceof Date) {
          data.value = value.toISOString()
        } else {
          data.value = JSON.stringify(value)
        }

        dataType.value = getDataType(value)
      } catch (e) {
        data.value = ''
        await showErrorAlert(e)
      }
    }

    async function onRemove() {
      try {
        const success = await storage.remove(key.value)

        if (success) {
          await showAlert(`Item for key "${key.value}" removed successfully.`)
        } else {
          await showAlert(`There is no item with the key "${key.value}".`)
        }
      } catch (e) {
        await showErrorAlert(e)
      } finally {
        data.value = ''
      }
    }

    async function onClear() {
      try {
        await storage.clear()
        key.value = ''
        await showAlert(`All items with prefix '${storage.keyPrefix}' removed.`)
      } catch (e) {
        await showErrorAlert(e)
      } finally {
        data.value = ''
      }
    }

    async function onSetPrefix() {
      storage.keyPrefix = prefix.value
      await showAlert(`Prefix set to "${prefix.value}".`)
    }

    async function onShowKeys() {
      const keys = await storage.keys()
      keys.sort()

      let qty: string

      switch (keys.length) {
        case 0:
          qty = 'are no'
          break

        case 1:
          qty = 'is 1'
          break

        default:
          qty = `are ${keys.length}`
      }

      let msg = `There ${qty} key${
        keys.length === 1 ? '' : 's'
      } with the prefix '${prefix.value}'.`

      if (keys.length > 0) {
        msg += '<br><br>' + keys.join('<br>')
      }

      await showAlert(msg)
    }

    function isStorageError(error: Error): error is StorageError {
      // eslint-disable-next-line no-prototype-builtins
      return error?.hasOwnProperty('code')
    }

    async function showErrorAlert(error: Error | StorageError) {
      let message = error.message

      if (isStorageError(error)) {
        message += ` [${error.code}]`
      }

      await showAlert(message + '.')
    }

    async function showAlert(message: string) {
      const alert = await alertController.create({
        header: `The plugin says:`,
        subHeader: '',
        message,
        buttons: ['OK']
      })
      await alert.present()
    }

    return {
      Capacitor,
      data,
      dataType,
      key,
      onClear,
      onDataChanged,
      onRemove,
      onGet,
      onSetPrefix,
      onSet,
      onShowKeys,
      prefix,
      storageType
    }
  }
})
</script>
